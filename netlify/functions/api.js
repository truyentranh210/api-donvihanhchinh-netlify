const fs = require("fs");
const path = require("path");

// 🔹 Xác định đường dẫn đến file dvhcvn.json
const dataPath = path.join(__dirname, "dvhcvn.json");

// 🔹 Đọc file JSON (đảm bảo tồn tại khi deploy)
let data = [];
try {
  const raw = fs.readFileSync(dataPath, "utf8");
  data = JSON.parse(raw).data || [];
} catch (err) {
  console.error("❌ Lỗi đọc file dvhcvn.json:", err);
}

exports.handler = async (event) => {
  const route = event.path;
  const query = event.queryStringParameters;

  // 🏠 /home — hướng dẫn sử dụng
  if (route.endsWith("/home")) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        message: "📘 API Đơn vị hành chính Việt Nam",
        description: "Trả về dữ liệu tỉnh, huyện, xã từ file JSON gốc.",
        endpoints: {
          "/home": "Hiển thị hướng dẫn này",
          "/dvhc": "Trả về toàn bộ danh sách đơn vị hành chính",
          "/dvhc?=Hà Nội": "Tìm kiếm theo tên tỉnh, huyện hoặc xã"
        },
        examples: {
          all: "https://<your-site>.netlify.app/dvhc",
          search: "https://<your-site>.netlify.app/dvhc?=Đà Nẵng"
        }
      }, null, 2)
    };
  }

  // 🔍 /dvhc — toàn bộ hoặc tìm kiếm
  if (route.endsWith("/dvhc")) {
    const keyword = (query[""] || "").trim().toLowerCase();

    // Nếu không có từ khóa → trả toàn bộ
    if (!keyword) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(data, null, 2)
      };
    }

    // Nếu có từ khóa → lọc tỉnh / huyện / xã
    const results = [];
    for (const tinh of data) {
      const matchTinh = tinh.name.toLowerCase().includes(keyword);
      const matchedHuyen = [];

      for (const huyen of tinh.level2s) {
        const matchHuyen = huyen.name.toLowerCase().includes(keyword);
        const matchedXa = huyen.level3s.filter(xa =>
          xa.name.toLowerCase().includes(keyword)
        );

        if (matchHuyen || matchedXa.length > 0) {
          matchedHuyen.push({
            ...huyen,
            level3s: matchedXa.length ? matchedXa : huyen.level3s
          });
        }
      }

      if (matchTinh || matchedHuyen.length > 0) {
        results.push({
          ...tinh,
          level2s: matchedHuyen.length ? matchedHuyen : tinh.level2s
        });
      }
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(results.length ? results : { error: "❌ Không tìm thấy kết quả" }, null, 2)
    };
  }

  // ❌ endpoint không tồn tại
  return {
    statusCode: 404,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ error: "Không tìm thấy endpoint. Truy cập /home để xem hướng dẫn." })
  };
};
