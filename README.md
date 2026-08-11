# dental-oshawa

## Project layout

Deploy only what's in docs folder to github pages.

## Agentic Form Submissions

Websites are already visited by more bots and agents than real people today. We need to be ready for the future of brick and mortar where people book in-person appointments through agents.

For independent stores with a minimal budget there's 2 ways I would handle this, but by far the easiest is by relying on Google Auth (not Google OAuth) and using Google Apps Scripts as a "backend". The problem is that you want to allow agents to submit requests without removing too much restrictions on your HTML forms or you will risk inundating your system with junk requests.

To handle this you create 2 flows: one human flow which stays protected by captcha or in this case Cloudflare Turnstile (due to HIPAA). The second is the bot or agent flow. To prevent spam 

create a honeypot endpoint that is for agents that are not currently booking appointments or creating referrals and explain that in the openapi.json and llms.txt 

### Google Auth

For your Google Apps Script backend, create 2 separate projects for the scripts so you can manage the permissions separately. For the non-bot endpoint, set it up as public access and run as you. For the bot endpoint, deploy as a web app with "Execute the app as: User accessing the web app" and "Who has access to the app: Anyone, even anonymous". Then setup the appsscript.json and get it verified.

### Bring your own endpoint

The tricky part is that you need to set an API authentication system. This could be through AWS Cognito where you give all logged in and logged out users a role and you limit usage of that role. This is so that you don't get bombarded by messages from the same bots. You could also setup an OAuth login page such as with Twilio or if you have a login script, particularly one that uses auth systems that are common such as Google or Apple. However, then the agent still has to obtain the Authorization token or API key to be able to query your endpoint and that requires a 
