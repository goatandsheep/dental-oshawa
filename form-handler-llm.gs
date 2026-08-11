/**
 * Google Apps Script for form forwarding.
 * Data is sent via email and NOT logged or saved to a spreadsheet.
 * Deploy as a web app with "Execute the app as: User accessing the web app" and "Who has access to the app: Anyone, even anonymous".
 * 
 * This version does not include Cloudflare Turnstile verification.
 * It is intended for environments where bot protection is handled elsewhere or not required.
 */

function doPostLlm(e) {
  try {
    // Parse the incoming JSON data
    var data = JSON.parse(e.postData.contents);
    var formName = data.formName || "Website Submission";

    // If the honeypot field is filled, it's a bot.
    // We return a "success" response so the bot doesn't know it failed.
    if (data.hp_field && data.hp_field !== "") {
      return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var scriptProperties = PropertiesService.getScriptProperties();
    var targetEmail = scriptProperties.getProperty('TARGET_EMAIL');

    var patientName = data['patient-name'];
    if (!patientName) {
      return ContentService.createTextOutput(JSON.stringify({ "result": "error", "message": "Missing name" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Build the email body dynamically from form fields
    var emailBody = "New submission from: " + formName + "\n";
    emailBody += "Timestamp: " + new Date().toLocaleString() + "\n";
    emailBody += "------------------------------------------\n\n";

    for (var key in data) {
      if (key !== "formName") {
        // Format the labels (e.g., patient-name -> Patient Name)
        var label = key.replace(/-/g, ' ').replace(/\b\w/g, function (l) { return l.toUpperCase(); });
        emailBody += label + ": " + data[key] + "\n";
      }
    }

    // Send the email
    // MailApp is used for simple forwarding; it doesn't leave a 'Sent' copy in some configurations
    // ensuring data doesn't linger in more places than necessary.
    MailApp.sendEmail({
      to: targetEmail,
      subject: "NEW FORM: " + formName + " - " + patientName,
      body: emailBody
    });

    return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // In production, you might want to log the error to a private log,
    // but never the 'data' containing PHI.
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "message": "Submission failed" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
