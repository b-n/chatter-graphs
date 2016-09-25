# chatter-graphs

A small project using d3 and the Salesforce REST Chatter API to get chatter influence scores with some other user metrics.

## Installation

Clone it

```
npm install
npm start
```

open browser to `http://localhost:5000/`

## .env vars

```
endpoint=https://login.salesforce.com/services/oauth2/token
grant_type=password
client_id=<oauth app client id>
client_secret=<oauth app client secret>
username=<salesforce username>
password=<salesforce password>
```

## todo

Lots of things, this is just a test using the REST API and d3 to make some charts.

Only test on Chrome 53, 64-bit Ubuntu. Uses lots of ES6 goodness, so unlikely to work on older browsers.
