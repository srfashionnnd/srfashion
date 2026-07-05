SR FASHION NANDED — Stock Site (Setup Guide)
=============================================

Ye 4 files hai:
1. index.html   -> Page ka structure (isko chhedne ki zarurat nahi)
2. style.css    -> Dark + gold look (colors change karne ho to yaha)
3. script.js    -> Sara logic (search, filter, admin login, barcode scan)
4. Stock.csv    -> SAMPLE data hai. Isko apni real Busy export CSV se replace karna hai.

UPDATE (real data ke saath)
-----------------------------
Ab Stock.csv me aapki asli file (items-db26.csv) ka data hai. Ye file bina
header ke hai — seedhe data rows se shuru hoti hai, is order me:

  Column 1: Item Code   -> site par NAHI dikhaya jaata (ignore, jaisa bola tha)
  Column 2: Item Name
  Column 3: MRP
  Column 4: Sale Price
  Column 5: Purchase Price  -> sirf Admin login ke baad dikhta hai
  Column 6: Stock Qty

Is file me Category/Brand/Wholesale nahi hai, isliye "All Brands" / "All
Groups" dropdown aur "By Group" sort option apne aap chhup jayenge jab tak
wo data na ho. Agar future me Busy export me Category/Brand column add ho,
to script.js ke top wale "POSITIONAL_COLUMNS" list me sahi jagah par
"category" / "brand" / "wholesale" word add kar dena — baaki sab apne aap
kaam karega.

Negative stock (jaise -3, -60) matlab Busy me oversold/pending hai — site
par aisi items "Out of Stock" dikhengi.

KAISE USE KARE
---------------
1. In 4 files ko apne GitHub repo ke root folder me daal do (jaha pehle se
   index.html tha, wahi overwrite kar do).
2. Apna Python watch script jo Busy se CSV export karta hai, usse bhi ISI
   6-column order (Code, Name, MRP, Sale, Purchase, Stock) me "Stock.csv"
   generate/replace karne ko bolo — bina header row ke.
3. Admin password already set hai:
   ADMIN_PASSWORD: "7277"
   (change karna ho to script.js me isi line par karna)
4. GitHub me push karo (jo batch script pehle se bana rahe the, wahi use karo).
   GitHub Pages automatically update ho jayega.

ADMIN VS PUBLIC VIEW
----------------------
- Normal visitor ko sirf MRP, Sale Price, Wholesale, Stock dikhega.
- "Admin" button dabakar password daalne ke baad Purchase Price bhi dikhega
  aur button "Logout" ban jayega.
- Ye sirf ek simple front-end lock hai (password chhupi hui nahi hai file me),
  isliye real secret data (jaise bank details) kabhi is tarah mat rakhna.

BARCODE SCAN
-------------
- Scan button camera khol ke barcode padhne ki koshish karega (Chrome pe
  best kaam karta hai, especially Android par). Agar browser support nahi
  karta to alert dikhega — us case me manually type karke search kar sakte ho.

AGAR KUCH GALAT DIKHE
-----------------------
- Sabse pehle browser me right-click -> Inspect -> Console tab kholo, wahan
  error dikhega. Wo error mujhe (Claude) copy-paste karke bhejo, main fix kar
  dunga.
