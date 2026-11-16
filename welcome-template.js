// Welcome email template for the Solne newsletter Worker
export function welcomeHtml({ heroUrl, unsubUrl }) {
  return `<!DOCTYPE html>
<html lang="el">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>Καλώς ήρθες στη Solne</title>
<style>
body{margin:0;padding:0;background:#d9d7d2}
img{border:0;display:block}
a{color:inherit}
@media (max-width:620px){
 .w{width:100%!important}
 .pad{padding-left:20px!important;padding-right:20px!important}
 .h1{font-size:34px!important;line-height:38px!important}
 .col{display:block!important;width:100%!important}
 .col+.col{padding-top:16px!important}
}
</style>
</head>
<body style="margin:0;padding:0;background:#d9d7d2;">
<!-- preheader (κείμενο προεπισκόπησης στο inbox) -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#d9d7d2;">Ευχαριστούμε που γράφτηκες στο newsletter της Solne.</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#d9d7d2;">
<tr><td align="center" style="padding:24px 12px;">

<table role="presentation" class="w" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#f2f0ec;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1a1a1a;">

 <!-- hero (embedded image) -->
 <tr><td style="padding:0;line-height:0;font-size:0;">
  <img src="${heroUrl}" width="600" height="400" alt="Solne, γραφικό σχέδιο σε μαύρο, άσπρο και κόκκινο" style="width:100%;max-width:600px;height:auto;">
 </td></tr>

 <!-- welcome -->
 <tr><td class="pad" style="padding:36px 32px 8px 32px;">
  <h1 class="h1" style="margin:0;font-size:44px;line-height:46px;font-weight:800;letter-spacing:-1px;color:#1a1a1a;">Καλώς ήρθες στη Solne.</h1>
 </td></tr>
 <tr><td class="pad" style="padding:12px 32px 32px 32px;font-size:16px;line-height:25px;color:#444;">
  Ευχαριστούμε που γράφτηκες στο newsletter μας. Θα σου στέλνουμε τα τελευταία νέα και drops.
 </td></tr>

 <!-- divider -->
 <tr><td class="pad" style="padding:0 32px;"><div style="height:2px;background:#1a1a1a;line-height:2px;font-size:0;">&nbsp;</div></td></tr>

 <!-- story -->
 <tr><td class="pad" style="padding:28px 32px 8px 32px;">
  <h2 style="margin:0;font-size:24px;line-height:30px;font-weight:800;color:#1a1a1a;">Η ιστορία της Solne</h2>
 </td></tr>
 <tr><td class="pad" style="padding:8px 32px 40px 32px;font-size:16px;line-height:25px;color:#444;">
  Η Solne είναι ένα ανεξάρτητο streetwear brand που δημιουργήθηκε στην Αθήνα.
  <br><br>
  Επηρεασμένη από την graffiti κουλτούρα, την underground σκηνή και τη σύγχρονη γραφιστική, η Solne συνδυάζει πρωτότυπα σχέδια, έντονη τυπογραφία και εικαστικά στοιχεία σε κάθε της κυκλοφορία.
  <br><br>
  Κάθε συλλογή αναπτύσσεται γύρω από μια διαφορετική δημιουργική κατεύθυνση, με έμφαση στον σχεδιασμό και τις περιορισμένες παραγωγές.
  <br><br>
  Χωρίς μαζική παραγωγή και χωρίς να ακολουθεί συγκεκριμένους κανόνες.
 </td></tr>

 <!-- footer -->
 <tr><td class="pad" style="background:#1a1a1a;padding:28px 32px;font-size:13px;line-height:21px;color:#8a8a86;">
  <div style="color:#f2f0ec;font-weight:700;letter-spacing:4px;padding-bottom:8px;">SOLNE</div>
  Αθήνα, Ελλάδα &nbsp;|&nbsp; Instagram: <a href="https://instagram.com/dreams_dont_pay_rent" style="color:#f2f0ec;">@dreams_dont_pay_rent</a>
  <div style="padding-top:14px;">Έλαβες αυτό το email επειδή γράφτηκες στο newsletter της Solne.<br>
  <a href="${unsubUrl}" style="color:#f2f0ec;">Διαγραφή από τη λίστα</a></div>
 </td></tr>

</table>
</td></tr>
</table>
</body>
</html>
`;
}
