export default {
  async fetch(request, env) {
    if (request.method === 'POST') {
      const update = await request.json();
      const message = update.message;
      if (!message || !message.text) {
        return new Response('No message text', { status: 400 });
      }
      const chatId = message.chat.id;
      const text = message.text.trim();
      const telegramToken = env.TELEGRAM_BOT_TOKEN;

      if (text === '/start') {
        // Send a welcome message
        await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: 'سلام! هر متنی که بفرستی به فارسی ترجمه می‌کنم یا بالعکس.'
          }),
        });
        return new Response('OK', { status: 200 });
      }

      // Detect language and set source and target language for translation
      // For simplicity, we use a regex to check if text contains Persian characters
      const persianRegex = /[\u0600-\u06FF]/;
      let source_lang, target_lang;

      if (persianRegex.test(text)) {
        source_lang = 'fa';
        target_lang = 'en';
      } else {
        source_lang = 'en';
        target_lang = 'fa';
      }

      const input = {
        text: text,
        source_lang,
        target_lang
      };

      try {
        const response = await env.AI.run("@cf/meta/m2m100-1.2b", input);
        const translatedText = response.translated_text;
        await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: translatedText
          }),
        });
        return new Response('OK', { status: 200 });
      } catch (error) {
        await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: 'خطایی در ترجمه به وجود آمد.'
          }),
        });
        return new Response('Translation error', { status: 500 });
      }
    }
    return new Response('Not Found', { status: 404 });
  }
}
