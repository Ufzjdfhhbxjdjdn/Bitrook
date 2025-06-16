const processedTxIds = new Set(
    JSON.parse(localStorage.getItem("processedTxIds") || "[]")
); // استرجاع المعرفات المخزنة مسبقًا

let fetching = false; // لتجنب بدء تحميل أكثر من مرة في نفس الوقت

async function fetchTransactions() {
    if (fetching) return; // إذا كانت عملية الجلب قيد التنفيذ، لا تبدأ عملية جديدة
    fetching = true;

    const urlParams = new URLSearchParams(window.location.search);
    const address = urlParams.get("address") || "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo"; // استخدام العنوان من الرابط، أو عنوان افتراضي
    let lastTxId = null;

    try {
        let fetchedCount = 0; // عدد المعاملات التي تم جلبها في الدورة الحالية
        let totalTxCount = 100000; // نحدد العدد الإجمالي للمعاملات في البداية

        // استمر في تحميل المعاملات تدريجيًا حتى يتم جلب جميع المعاملات
        while (fetchedCount < totalTxCount) {
            let url = `https://mempool.space/api/address/${address}/txs/chain`;
            if (lastTxId) {
                url += `/${lastTxId}`; // إضافة lastTxId للحصول على المعاملات التي تلي المعاملة الأخيرة
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.length === 0) {
                break; // إذا لم يكن هناك بيانات جديدة، نوقف البحث
            }

            // تحديد المعاملات الجديدة فقط
            const newTxs = data.filter((tx) => !processedTxIds.has(tx.txid));
            newTxs.forEach((tx) => processedTxIds.add(tx.txid)); // إضافة المعرفات الجديدة

            fetchedCount += newTxs.length; // تحديث عدد المعاملات التي تم جلبها
            lastTxId = data[data.length - 1].txid; // تحديث lastTxId لاستخدامه في الاستعلام التالي

            // عرض المعاملات الجديدة
            displayTransactions(newTxs);

            // إضافة التأخير لمدة ثانية واحدة بين الطلبات لتقليل الضغط على الخادم
            await new Promise((resolve) => setTimeout(resolve, 1000)); // تأخير 1 ثانية
        }

        // حفظ المعرفات الجديدة في localStorage بعد تحميل جميع المعاملات
        localStorage.setItem("processedTxIds", JSON.stringify([...processedTxIds]));

        console.log(`Fetched ${fetchedCount} transactions!`);
    } catch (error) {
        console.error("Error fetching transactions:", error);
    }

    fetching = false; // إعادة تعيين حالة الجلب بعد الانتهاء
}

function displayTransactions(txs) {
    const resultDiv = document.getElementById("result");
    txs.forEach((tx) => {
        const txDetails = `<pre>${JSON.stringify(tx, null, 0)}</pre>`; // التنسيق الأصلي لـ JSON
        resultDiv.innerHTML += txDetails;
    });
}

// تحميل المعاملات تلقائيًا عند تحميل الصفحة لأول مرة
window.onload = fetchTransactions;

// استخدام حدث الضغط على زر لتحميل المزيد من المعاملات إذا رغبت في ذلك:
document.getElementById("loadMoreBtn")?.addEventListener("click", fetchTransactions);
