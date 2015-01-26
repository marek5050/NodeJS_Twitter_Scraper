#NodeJS Twitter Scraper

To run
% ./node app.js

The scraper will run through the Twitter Verified account and create a list of all verified user handles. Then it performs
a search on the individual handles for certain e-mail keywords ie. email me, gmail.com, yahoo.com, live.com, even 'at dot'. Users try
to outsmart scrapers using different variations like john dot small at gmail dot com. When the scraper receives such results ie. 'at dot' 
it removes all special characters and replaces at with @ and dot with . , if the result matches a valid email it is logged.
 
Twitter smartly terminates the scraper after too many requests, about 1.4million per minute. To sidestep this protection
just add a delay to the requests, like 1ms. With no delays the script takes about 45 minutes to run through the 150k verified users. 

The scripts definitely need to be prettyfied.

 
