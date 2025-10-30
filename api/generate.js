// ... (existing code) ...
    try {
        // --- PHẦN SỬA LỖI 400 ---
// ... (existing code) ...
        } else {
            // Giả sử Vercel đã parse
            requestBody = request.body;
        }

        // --- SỬA LỖI LOGIC 400 ---
        // Frontend đang gửi toàn bộ payload của Gemini.
        // Chúng ta sẽ trích xuất prompt (userQuery) từ đó, thay vì mong đợi { prompt: "..." }
        const prompt = requestBody?.contents?.[0]?.parts?.[0]?.text;
        
        // Lấy system prompt (nếu có)
        const systemPrompt = requestBody?.systemInstruction;
        // --- KẾT THÚC SỬA LỖI LOGIC ---

        if (!prompt) {
// ... (existing code) ...
            return response.status(400).json({ error: 'Không nhận được prompt. Dữ liệu rỗng.' });
        }

        // Tạo payload để gửi đến Gemini
        // Chúng ta xây dựng lại payload ở backend để đảm bảo an toàn
        const payload = {
            contents: [{
                parts: [{ text: prompt }]
            }],
            // Thêm systemInstruction nếu frontend đã gửi
            ...(systemPrompt && { systemInstruction: systemPrompt }),
            
            // Cài đặt an toàn và cấu hình tạo (luôn đặt ở backend cho an toàn)
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
// ... (existing code) ...
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
            ],
            generationConfig: {
// ... (existing code) ...
                topP: 0.9,
                maxOutputTokens: 2048,
            }
        };

        // Gọi đến API của Google (Backend gọi Backend)
// ... (existing code) ...