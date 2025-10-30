// /api/generate.js

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed. Chỉ chấp nhận POST.' });
    }

    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
        console.error('LỖI: Chưa thiết lập GEMINI_API_KEY trên Vercel.');
        return response.status(500).json({ error: 'API key chưa được cấu hình trên máy chủ.' });
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`;

    try {
        // --- PHẦN SỬA LỖI 400 ---
        // Vercel có thể không tự động parse body, chúng ta parse thủ công
        // Lưu ý: request.body có thể đã là object (nếu Vercel parse) 
        // hoặc là string (nếu Vercel không parse).
        let requestBody;
        if (typeof request.body === 'string') {
            try {
                requestBody = JSON.parse(request.body);
            } catch (e) {
                return response.status(400).json({ error: 'Request body không phải là JSON hợp lệ.' });
            }
        } else {
            // Giả sử Vercel đã parse
            requestBody = request.body;
        }

        // Lấy prompt từ body đã được parse
        const { prompt } = requestBody;
        // --- KẾT THÚC PHẦN SỬA LỖI ---

        if (!prompt) {
            // Dòng này bây giờ sẽ hoạt động đúng
            return response.status(400).json({ error: 'Không nhận được prompt. Dữ liệu rỗng.' });
        }

        // Tạo payload để gửi đến Gemini
        const payload = {
            contents: [{
                parts: [{ text: prompt }]
            }],
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
            ],
            generationConfig: {
                temperature: 0.8,
                topK: 40,
                topP: 0.9,
                maxOutputTokens: 2048,
            }
        };

        // Gọi đến API của Google (Backend gọi Backend)
        const geminiResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        // Xử lý nếu Google báo lỗi
        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.text();
            console.error('Lỗi từ Google API:', errorBody);
            return response.status(geminiResponse.status).json({ error: `Google API báo lỗi: ${errorBody}` });
        }

        // Lấy kết quả từ Google
        const data = await geminiResponse.json();

        // Trích xuất nội dung văn bản
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            console.error('Không trích xuất được text từ Google response:', data);
            return response.status(500).json({ error: 'Không nhận được nội dung từ AI.' });
        }

        // Gửi đề thi (text) về cho frontend
        response.status(200).json({ text });

    } catch (error) {
        console.error('Lỗi nghiêm trọng trong hàm API:', error);
        response.status(500).json({ error: `Lỗi máy chủ nội bộ: ${error.message}` });
    }
}

