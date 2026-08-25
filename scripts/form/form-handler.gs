/**
 * Google Apps Script for form forwarding.
 * Data is sent via email and NOT logged or saved to a spreadsheet.
 */

function doPost(e) {
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
    var turnstileSecretKey = scriptProperties.getProperty('CF_TURNSTILE_SECRET_KEY');
    var targetEmail = scriptProperties.getProperty('TARGET_EMAIL');

    var turnstileToken = data.turnstileToken;

    // If no token is present, or verification fails, reject the request
    if (!turnstileToken) {
      return ContentService.createTextOutput(JSON.stringify({ "result": "error", "message": "Missing captcha" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Verify with Cloudflare
    var verifyResponse = UrlFetchApp.fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      payload: {
        secret: turnstileSecretKey,
        response: turnstileToken
      }
    });

    var result = JSON.parse(verifyResponse.getContentText());

    // If Cloudflare says it's a bot, stop here
    if (!result.success) {
      // Return success to the bot to avoid brute force analysis,
      // but don't actually send the email.
      return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var patientName = data['patient-name'];
    if (!patientName) {
      return ContentService.createTextOutput(JSON.stringify({ "result": "error", "message": "Missing name" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Build the email body dynamically from form fields
    var emailBody = "New submission from: " + formName + "\n";
    var emailBodyHTML = "<h1>New submission from: " + formName + "</h1><br><br>";

    emailBody += "Timestamp: " + new Date().toLocaleString() + "\n";
    emailBodyHTML += "<strong>Timestamp:</strong> " + new Date().toLocaleString() + "<br><br>";

    emailBody += "------------------------------------------\n\n";
    emailBodyHTML += "<hr><br>";

    for (var key in data) {
      if (key !== "formName") {
        // Format the labels (e.g., patient-name -> Patient Name)
        var label = key.replace(/-/g, ' ').replace(/\b\w/g, function (l) { return l.toUpperCase(); });
        emailBody += label + ": " + data[key] + "\n";
        emailBodyHTML += "<strong>" + label + ":</strong> " + data[key] + "<br><br>";
      }
    }

    // Send the email
    // MailApp is used for simple forwarding; it doesn't leave a 'Sent' copy in some configurations
    // ensuring data doesn't linger in more places than necessary.
    MailApp.sendEmail({
      to: targetEmail,
      subject: "NEW FORM: " + formName + " - " + patientName,
      body: emailBody,
      htmlBody: emailBodyHTML
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
