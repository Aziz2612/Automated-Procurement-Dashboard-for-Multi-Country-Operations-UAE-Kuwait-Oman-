// 🚀 Entry point: Responsible for loading the HTML dashboard when المستخدم يفتح اللينك
function doGet() {
  return HtmlService.createTemplateFromFile('index') // بيستدعي ملف HTML اسمه index
      .evaluate() // بيحوّله لصفحة جاهزة للعرض
      .setTitle('Procurement Dashboard') // عنوان الصفحة
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL) // يسمح بعرض الصفحة داخل iframe
      .addMetaTag('viewport', 'width=device-width, initial-scale=1'); // يخلي التصميم responsive على الموبايل
}


// 📊 Function: Responsible for fetching and cleaning data from Google Sheets
function getRawData() {
  try {
    const ssId = "YOUR_SHEET_ID";     
    const sheetName = "Data"; 
    const response = Sheets.Spreadsheets.Values.get(ssId, `${sheetName}!A:AH`); 
    const data = response.values;
    if (!data || data.length < 2) 
    throw new Error('الشيت فارغ أو لا يحتوي على بيانات');

    // 🏷️ أول صف = headers (أسماء الأعمدة)
    const headers = data[0].map(h => h.toString().trim());
    
    // 🌍 تحديد التايم زون
    const timeZone = Session.getScriptTimeZone();
    
    // 🔄 تحويل كل صف لـ Object (key = column name)
    const cleanRows = data.slice(1).map(row => {
      let obj = {};

      headers.forEach((header, index) => {
        let val = row[index] || "";
        
        // 📅 لو القيمة Date object → نحولها لصيغة YYYY-MM-DD
        if (val instanceof Date) {
           val = Utilities.formatDate(val, timeZone, "yyyy-MM-dd");
        } 
        
        // 📅 لو القيمة رقم كبير → غالبًا Excel serial date → نحوله لتاريخ
        else if (typeof val === 'number' && val > 40000) { 
           try {
             val = Utilities.formatDate(
               new Date((val - 25569) * 86400 * 1000), 
               timeZone, 
               "yyyy-MM-dd"
             );
           } catch(e) { 
             val = row[index]; // لو فشل التحويل → نرجع القيمة الأصلية
           }
        }
        
        // 🧩 ربط كل قيمة باسم العمود بتاعها
        obj[header] = val;
      });

      return obj;
    });

    // ✅ رجوع البيانات بشكل JSON string للـ frontend
    return { 
      status: 'success', 
      rows: JSON.stringify(cleanRows) 
    };

  } catch (e) {

    // ❌ في حالة error → يرجع رسالة الخطأ
    return { 
      status: 'error', 
      message: e.toString() 
    };
  }
}
