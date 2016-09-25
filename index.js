import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import FormData from 'form-data';

dotenv.load();

const app = express();

app.set('port', process.env.PORT || 5000);
app.use(express.static('dist'));
app.get('/data', (req, res) => {
    
    const { endpoint, grant_type, client_id, client_secret, username, password } = process.env; 

    const data = 'grant_type=' + encodeURIComponent(grant_type) + '&' +
        'client_id=' + encodeURIComponent(client_id) + '&' +
        'client_secret=' + encodeURIComponent(client_secret) + '&' + 
        'username=' + encodeURIComponent(username) + '&' + 
        'password=' + encodeURIComponent(password);

    fetch(endpoint, {
        body: data,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        method: 'POST'
    })
    .then(result => result.json())
    .then(body => getChatterData(body.instance_url + '/services/data/v37.0/chatter/users', body.access_token, 0))
    .then(chatterData => {
        res.status(200).send(chatterData);
    })
    .catch(error => {
        res.status(400).send({ message: 'it broke' });
    });
});

function getChatterData(endpoint, token, page) {
    return fetch(endpoint + '?pageSize=100&page=' + page, {
        method: 'GET',
        headers: { 'Content-Type' : 'application/json', 'Authorization': 'Bearer ' + token }
    })
    .then(result => result.json())
    .then(body => {
        const userRecords = body.users.map(user => generateUser(user));
        if (!body.nextPageToken) return userRecords;
        
        return getChatterData(endpoint, token, page + 1)
        .then(data => {
            return userRecords.concat(data);
        });
    });
}

function generateUser(userRecord) {
    const { chatterActivity, chatterInfluence, name, email, username, followersCount, followingCount, groupCount, managerName, title } = userRecord;
    return {
        chatterActivity,
        chatterInfluence,
        name,
        email,
        username,
        followersCount,
        followingCount,
        groupCount,
        managerName,
        title
    };
}

app.listen(app.get('port'), () => {
    console.log('app running on port ' + app.get('port'));
});

