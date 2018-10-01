const API_ROOT = 'https://app.snov.io';
const CLIENT_ID = 'b3b88e7d22801716f9dde2cffde66526';
const CLIENT_SECRET = '851fe5ec5e7922ea8ddcc7d568f0e4b1';

export default class EmailFinder {
    constructor() {
        this.tokenInfo = null;
    }

    find(domain, firstName, lastName) {
        return this.request(`${API_ROOT}/restapi/get-emails-from-names`, 'POST', {domain, firstName, lastName})
            .then(response => response.data.emails || [])
    }

    async request(url, method, data = {}) {
        if (this.tokenInfo === null || this.tokenInfo._expires_in > Date.now()) {
            await this.updateTokenInfo();
        }

        const options = {
            method: method,
            body: JSON.stringify(Object.assign({access_token: this.tokenInfo.access_token}, data)),
            headers: {'Content-Type': 'application/json'}
        };

        return window.fetch(url, options)
            .then(response => response.json())
            .catch(e => console.log(e))
    }

    async updateTokenInfo() {
        const response = await window.fetch(`${API_ROOT}/oauth/access_token`, {
            method: 'POST',
            crossDomain: true,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'client_credentials'
            })
        });
        const tokenInfo = await response.json();

        this.tokenInfo = Object.assign({_expires_in: Date.now() + tokenInfo.expires_in}, tokenInfo)
    }
}