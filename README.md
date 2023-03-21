# auto-ip-switcher

This automation script was created due to the constantly changing Public IP address of my local web server that I run. Unfortunately, my server kept having "downtime" and was not accessible because the dynamic IP system my ISP uses to hand out addresses randomly changes my public IP address. This would not be a problem except that I use Cloudflare, and have my A records on Cloudflare set to the public IP address of my web server. Instead of paying extra for a static IP address which would only add to the HIGH costs I am already paying, I decided to automate changing the A records I have set up on Cloudflare once a change on my web server is detected. This decreases server downtime dramatically. 

The script utilizes Node and views the dynamically addressed public IP ( issued by the ISP ) on the web server it resides on using the ipify.org API as well as views the A record content ( IP address ) set up on Cloudflare ( via the Cloudflare API ). The script then compares both IPs to make sure they match. If they do NOT match, the script then changes the A record content ( IP address ) previously set on Cloudflare to match the dynamic public IP used by the web server.
