# Học tiếng Trung

App cá nhân để luyện phiên âm (pinyin) tiếng Trung và học từ vựng bằng flashcard
lặp lại ngắt quãng (spaced repetition, kiểu SM-2/Anki). Viết lại bằng Vite +
React + TypeScript từ bản gốc 1-file-HTML.

## Chạy thử (dev)

```bash
npm install
npm run dev
```

Mở địa chỉ hiện ra (mặc định http://localhost:5173). Trên điện thoại cùng
mạng LAN, chạy `npm run dev -- --host` rồi mở `http://<ip-máy-tính>:5173`.

## Build

```bash
npm run build      # kiem tra kieu + build vao thu muc dist/
npm run preview    # xem thu ban build
npm run single     # build roi gop thanh 1 file hoc-tieng-trung.html duy nhat
```

`npm run single` tạo ra file `hoc-tieng-trung.html` ở thư mục gốc — mở trực
tiếp bằng trình duyệt hoặc copy vào điện thoại, không cần máy chủ, giống cách
dùng bản gốc. Mic (ghi âm chấm điểm) và nhận dạng giọng nói cần mở bằng
`http://` trên máy tính hoặc `https://`/`file://` tuỳ trình duyệt — Chrome
desktop và Safari/Chrome trên điện thoại hỗ trợ tốt nhất.

## Cấu trúc

```
src/
  data/           lessons.json (12 bai phien am), charmap.json (tra cuu
                  Han->pinyin cho cham diem giong noi), vocab.json (tu vung)
  lib/            logic thuan tuy: pinyin, speech (TTS), srs (SM-2),
                  pitch + recorder (ghi am, YIN pitch detection, nhan dang
                  giong noi), lessonHelpers (sinh cau hoi quiz), storage
  context/        RecorderContext (quan ly phien ghi am dang chay)
  hooks/          useStore (doc AppState), useVoice (trang thai giong TTS)
  components/     UI dung chung: Pinyin (to mau thanh dieu), Recorder
                  (mic/ket qua), QuizRunner, TopBar, BottomNav, Icons
  views/pinyin/   Home (lo trinh), Lesson (4 tab: hoc/bang ghep/doc/kiem tra),
                  Table (bang tra cuu), Review (on tap tong hop)
  views/vocab/    Home (thong ke + bat dau on), Review (flashcard SRS),
                  Browse (tim kiem danh sach tu)
```

## Dữ liệu

- `lessons.json` / `charmap.json` trích từ bản HTML gốc (không chỉnh sửa nội
  dung giáo trình).
- `vocab.json` là bộ từ mới: HSK1, HSK2, và một số câu giao tiếp thường dùng,
  mỗi mục có chữ Hán, pinyin, nghĩa tiếng Việt. Có thể thêm từ bằng cách thêm
  object `{"hz":"...","py":"...","vi":"...","lv":1}` vào file này (lv: 0 = câu,
  1 = HSK1, 2 = HSK2).

## Lưu trữ tiến độ

Toàn bộ tiến độ (âm đã nghe, điểm kiểm tra, âm cần ôn, lịch SRS từ vựng) lưu
trong `localStorage` của trình duyệt — mỗi trình duyệt/máy có tiến độ riêng,
không đồng bộ qua lại. Mục "Ôn tập › Xoá toàn bộ tiến độ" xoá sạch để học lại
từ đầu.
