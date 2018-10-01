const $ = require('jquery');
require('jquery-ui-bundle');

export default class ParserService {


    findEmailInfo(json) {
        const parseDomain = (websites = []) => {
            if (websites.length) {
                const website = websites.find(w => w.category === 'COMPANY') || websites[0];
                const url = new URL(website.url);
                const parts = url.host.split('.');
                return parts.length > 2 ? parts.shift() && parts.join('.') : parts.join('.');
            }

            return null;
        };

        return {
            firstName: json.firstName,
            lastName: json.lastName,
            domain: parseDomain(json.contactInfo.websites)
        }
    }


    findProfileJsonBlock(codeElements, sales) {
        if (sales) {
            let $json = $(codeElements)
                .find('#embedded-json');
            if (!$json.html()) {
                $json = $(codeElements)
                    .filter('#embedded-json');
            }
            if ($json.html()) {
                return $json.html()
                    .replace('<!--', '')
                    .replace('-->', '');
            } else {
                for (let i = 0; i < codeElements.length; i++) {
                    let codeText = $(codeElements[i])
                        .text();
                    let found = codeText.search('"flagshipProfileUrl"');
                    if (found !== -1) {
                        return $(codeElements[i])
                            .text();
                    }
                }
            }
            console.warn('Cannot find JSON code block. Need investigation.');
            return '';
        } else {
            for (let _i = 0; _i < codeElements.length; _i++) {
                let _codeText = $(codeElements[_i])
                    .text();
                let _found = _codeText.search('"profile"');
                if (_found !== -1) {
                    return $(codeElements[_i])
                        .text();
                }
            }
            return '';
        }
    }

    getPageCodeElements(link) {
        return new Promise(function (resolve, reject) {
            $.ajax({
                method: 'GET',
                url: link,
                success: function success(data) {
                    resolve($(data));
                },
                error: function error(data) {
                    reject(data);
                }
            });
        });
    }

    checkIfHasPremium(codeElements) {
        for (let i = 0; i < codeElements.length; i++) {
            let codeText = $(codeElements[i])
                .text();
            let found = codeText.search('"premium":true');
            if (found !== -1) {
                return true;
            }
        }
        return false;
    }

}