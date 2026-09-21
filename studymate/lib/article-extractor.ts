import { getChatCompletionText } from "./openai";

export async function extractArticleFromUrl(url: string): Promise<{ title: string; content: string }> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();

    // Extract title
    let title = "Web Article";
    const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1]
        .trim()
        .replace(/\s+/g, " ")
        .replace(/ - [^-]+$/, "") // Strip branding suffix (e.g. "- Wikipedia")
        .replace(/ \| [^|]+$/, "");
    }

    // Clean HTML to extract text content
    let bodyContent = html;

    // Try to grab only article body if <article> tag is present
    const articleMatch = html.match(/<article[\s\S]*?>([\s\S]*?)<\/article>/i);
    if (articleMatch && articleMatch[1]) {
      bodyContent = articleMatch[1];
    } else {
      // Or grab main if present
      const mainMatch = html.match(/<main[\s\S]*?>([\s\S]*?)<\/main>/i);
      if (mainMatch && mainMatch[1]) {
        bodyContent = mainMatch[1];
      }
    }

    // Remove scripts, styles, iframe, and other noise
    bodyContent = bodyContent
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "");

    // Strip all HTML tags but preserve line breaks
    let text = bodyContent
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, " ")
      .trim();

    // Truncate text if it is exceptionally long to avoid API limits
    if (text.length > 30000) {
      text = text.substring(0, 30000) + "\n...[Content truncated for length]";
    }

    // Call OpenAI/Azure OpenAI to structure it into markdown
    const systemPrompt = `You are a professional educational assistant. Your job is to extract and summarize/clean the educational content of a web page's text.
Convert the input text into a clean, structured study-friendly Markdown article.
Exclude all navigation links, social sharing buttons, advertisements, cookie banners, sidebars, or unrelated site metadata.
Return ONLY the clean Markdown text. Do not wrap the output in code blocks, and do not write introductory or explanatory remarks.`;

    const prompt = `Web page title: ${title}\nURL: ${url}\n\nWeb Page Text Content:\n${text}`;

    try {
      const cleanContent = await getChatCompletionText(prompt, systemPrompt, {
        modelTier: "standard",
        temperature: 0.1,
        requestName: "ArticleExtractor",
      });

      if (cleanContent && cleanContent.trim()) {
        return {
          title: title || "Imported Article",
          content: cleanContent,
        };
      }
    } catch (openaiErr) {
      console.warn("OpenAI cleaning failed, using raw extracted text:", openaiErr);
    }

    // Fallback to raw parsed text
    return {
      title: title || "Imported Article",
      content: text || "Empty article content.",
    };
  } catch (error) {
    console.error("Article extraction failed:", error);
    throw error;
  }
}
