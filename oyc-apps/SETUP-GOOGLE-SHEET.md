# Connect the OYC apps to Google Sheets (about 5 minutes)

This connects the Customer app, Partner app and Admin panel so they share live bookings.

1. Go to https://sheets.new and create a sheet named **OYC Bookings**.
2. In the sheet, open **Extensions → Apps Script**.
3. Delete everything in `Code.gs` and paste the whole contents of `dist/OYC-Google-Apps-Script.gs`.
4. Click **Save**. Then choose `setup` from the function dropdown and click **Run**. Allow the permissions it asks for (it only uses this one sheet).
   This creates three tabs: **Bookings**, **Partners** and **Settings**.
5. Click **Deploy → New deployment**, click the gear icon, and choose **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy** and copy the **Web app URL** (it ends in `/exec`).
6. Send that URL to Claude. Claude will put it into all three apps and republish them.

After that:
- Admin panel: https://theadweb.flexifunnels.com/oyc-admin. The default PIN is **1234**; change it in Settings.
- Add your partners in Admin → Partners (name, mobile, PIN). They log in at https://theadweb.flexifunnels.com/oyc-partner.
- Customers book at https://theadweb.flexifunnels.com/oyc-app. Each booking appears instantly in the Admin panel, and opens WhatsApp with the booking details.
- A booking you receive directly on WhatsApp can be entered with **Admin → + Add WhatsApp booking**.

How a booking flows:
Customer books → the booking lands in the sheet and on WhatsApp → Admin assigns a partner → the partner accepts in the Partner app → On the way → the partner enters the customer's 4-digit start code → Complete (amount collected). The customer sees every step in **My bookings**.
