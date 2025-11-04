const fs = require("fs");
const path = require("path");

const { data } = require("./dvhcvn.js");

// Đọc file JSON toàn bộ đơn vị hành chính
const data = JSON.parse(fs.readFileSync(dataPath, "utf8")).data;

exports.handler = async (event) => {
  const pathReq = event.path;
  const query = event.queryStringParameters;

  // 🏠 Trang hướng dẫn
  if (pathReq.endsWith("/home")) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        message: "📘 API Đơn vị hành chính Việt Nam",
        usage: {
          "/dvhc": "Trả về toàn bộ danh sách tỉnh/huyện/xã.",
          "/dvhc?=Hà Nội": "Tìm kiếm theo từ khóa (tỉnh, huyện hoặc xã).",
          "/home": "Hiển thị hướng dẫn này."
        },
        example: {
          all: "https://<your-site>.netlify.app/dvhc",
          search: "https://<your-site>.netlify.app/dvhc?=Hà Nội"
        }
      }, null, 2)
    };
  }

  // 🔍 Endpoint tìm kiếm /dvhc
  if (pathReq.endsWith("/dvhc")) {
    const keyword = query[""]?.trim() || "";

    // Nếu không có từ khóa → trả toàn bộ dữ liệu
    if (!keyword) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(data, null, 2)
      };
    }

    // Chuyển keyword về dạng không phân biệt hoa thường
    const key = keyword.toLowerCase();

    // Lọc dữ liệu theo tỉnh, huyện, xã
    const results = [];
    for (const tinh of data) {
      const matchTinh = tinh.name.toLowerCase().includes(key);
      const matchedHuyen = [];
      for (const huyen of tinh.level2s) {
        const matchHuyen = huyen.name.toLowerCase().includes(key);
        const matchedXa = huyen.level3s.filter(x =>
          x.name.toLowerCase().includes(key)
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
      body: JSON.stringify(results.length ? results : { error: "Không tìm thấy kết quả" }, null, 2)
    };
  }

  // ❌ Nếu endpoint không hợp lệ
  return {
    statusCode: 404,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      error: "Endpoint không tồn tại. Vào /home để xem hướng dẫn sử dụng."
    })
  };
};
