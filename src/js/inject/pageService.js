import ParserService from './parserService';
import { LINKEDIN_URL } from '../constants';
import EmailFinder from './emailFinderService';

const $ = require('jquery');
require('jquery-ui-bundle');

export default class PageService {

    constructor() {
        this.ui = '';
        this.startUrl = '';
        this.actionButtonsViews = [];
        this.validPageRules = [
            /^\/in\/[\w\d-]+\/$/, // Default UI - Profile
            /^\/search\/results\/(index|people|all)(\/v2)?\/$/, // Default UI - Search
            /^\/sales\/search$/, // Sales UI - Search
            /^\/sales\/profile\/[\w\d,_-]+$/, // Sales UI - Profile
            /^\/sales\/people\/[\w\d,_-]+$/, // Sales New UI - Profile
            /^\/sales\/search\/people/
        ];

        this.parser = new ParserService();
        this.emailFinder = new EmailFinder();

        this.setPageState();
    }


    initialize() {
        const that = this;
        if (this.isNewUI() || this.isNewSales()) {
            this.checkUrlWithInterval();
        } else {
            this.insertActionButtons();
        }

        $(document).on('click', '.cteq-le-action-view', function (e) {
            $(this).addClass('disabled');

            that.fetchProfileData($(this).parents('.action-buttons-wrapper').attr('data-member-id'))
                .then(async json => {
                    const emailInfo = that.parser.findEmailInfo(json);
                    const emailResp = await that.emailFinder.find(emailInfo.domain, emailInfo.firstName, emailInfo.lastName);
                    return {profile: json, emailResp};
                })
                .then(json => that.openPreviewWindow(json))
                .then(_ => $(this).removeClass('disabled'))
                .catch(_ => $(this).removeClass('disabled'));
        })
    }


    isNewUI() {
        return this.ui === 'new';
    }

    isSales() {
        return this.ui === 'sales' || this.isNewSales();
    }

    isNewSales() {
        return this.ui === 'sales_new';
    }

    isUnavailable() {
        return window.location.href.indexOf('/in/unavailable') !== -1;
    }

    callWithInterval(callback = _ => null) {
        const intervalId = setInterval(callback, 500);
        setTimeout(_ => clearInterval(intervalId), 10000);
    }

    checkUrlWithInterval() {
        setInterval(_ => {
            const currentUrl = window.location.href;

            if (!this.isUnavailable() &&
                this.checkIfValidPage() &&
                this.startUrl !== currentUrl) {

                // _this.removeViews();
                this.startUrl = currentUrl;
                this.removeAllActionButtons();
                this.insertActionButtons();
            }
        }, 300);
    }

    checkIfValidPage() {
        return this.validPageRules.some(pattern => {
            const result = window.location.pathname.match(pattern);
            return result && result[0];
        })
    }

    insertActionButtons() {
        const getKey = (delimiter = '_') => (this.ui + delimiter + this.type);

        const key = getKey();
        const functions = {
            'new_search': 'newSearch',
            'new_profile': 'newProfile',
            'v2_profile': 'v2Profile',
            'sales_search': 'salesSearch',
            'sales_profile': 'salesProfile',
            'sales_new_profile': 'salesNewProfile',
            'sales_new_search': 'salesNewSearch'
        };

        if (key in functions) this[functions[key]]();
    }

    setPageState() {
        this.ui = this.resolveUI();
        this.type = this.resolveType();
    }

    resolveType() {
        if (/(search)/.test(location.pathname)) {
            return 'search';
        } else if (/(in)|(profile)|(people)/.test(location.pathname)) {
            return 'profile';
        }
    }

    resolveUI() {
        const type = location.pathname.split('/')[1] === 'sales' ? 'sales' : 'new';

        switch (type) {
            case 'new':
                return $('.pv-top-card-v2-section__links')
                    .length > 0 ? 'v2' : 'new';
            case 'sales':
                return $('meta[name="renderingMode"]')
                    .length > 0 ? 'sales_new' : 'sales';
            default:
                return type;
        }
    }

    newSearch() {
        this.callWithInterval(() => {
            $('.search-result--person')
                .each((i, elem) => {
                    if ($(elem).find('.action-buttons-container').length > 0) return;

                    const parent = $(elem).find('.search-result__actions--primary').parent();
                    const profileLink = $(elem).find('.search-result__result-link').eq(1);
                    const memberUrl = profileLink.attr('href');

                    const actionsBlock = $('<div>').addClass('action-buttons-container');
                    parent.prepend(actionsBlock);

                    if (this.linkedInMember(profileLink)) return;

                    this.appendActionButtons(actionsBlock, this.getMemberIdFromUrl(memberUrl));
                });
        });
    }

    linkedInMember(profileLink) {
        return profileLink.text().indexOf('LinkedIn Member') > -1 ||
            profileLink.text().indexOf('account closed') > -1;
    }

    getMemberIdFromUrl(url) {
        const splitPath = url.split('/');
        return splitPath[splitPath.indexOf('in') + 1];
    }


    salesNewSearch() {
        const $target = $('.deferred-area');

        this.salesNewSearchInsert();

        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.attributeName === 'class') {
                    this.salesNewSearchInsert();
                }
            });
        });

        if ($target[0]) {
            observer.observe($target[0], {attributes: true});
        } else {
            return setTimeout(_ => this.salesNewSearch(), 500);
        }
    }

    salesNewSearchInsert() {
        const sections = $('li.search-results__result-item');
        if (sections.length === 0) {
            return setTimeout(_ => this.salesNewSearchInsert(), 500);
        }

        sections.toArray()
            .filter(section => !$(section).find('.result-lockup__action-item').first().find('.action-buttons-container').length)
            .forEach(section => {
                const actionsContainer = $(section).find('.result-lockup__action-item').first();
                const actionsBlock = $('<div></div>').addClass('action-buttons-container text-align-right');
                const profileLink = $(section).find('.result-lockup__name a');

                actionsContainer.prepend(actionsBlock);

                if (!profileLink.attr('href') || this.linkedInMember(profileLink)) {
                    return;
                }

                const memberId = profileLink.attr('href').split('?').shift();
                this.appendActionButtons(actionsBlock, memberId);
            });
    }

    removeAllActionButtons() {
        $('.action-buttons-container').remove();
    }

    appendActionButtons(actionsBlock, memberId) {
        actionsBlock.html(`<div class="action-buttons-wrapper" data-member-id="${memberId}">
                      <button class="button-primary-small inline-block mr2 pl2 pr2 text-align-center cteq-le-action-view">
                          <svg 
                          viewBox="0 -2 22 22" 
                          width="16px" 
                          height="16px" 
                          x="0" 
                          y="0" 
                          preserveAspectRatio="xMinYMin meet" 
                          class="artdeco-icon" 
                          focusable="false">
                            <path 
                            d="M21,19.67l-5.44-5.44a7,7,0,1,0-1.33,1.33L19.67,21ZM10,15.13A5.13,5.13,0,1,1,15.13,10,5.13,5.13,0,0,1,10,15.13Z" 
                            class="large-icon"
                            style="fill: currentColor"></path>
                          </svg>
                      </button>
                      
                     <button class="button-primary-small inline-block mr2 pl2 pr2 text-align-center cteq-le-action-export">
                        <svg preserveAspectRatio="xMinYMin meet" viewBox="2 -2 20 20" width="16px" height="20px">
                            <g class="small-icon" style="fill-opacity: 1;fill: currentColor;">
                                <path d="M18,13h-5v5h-2v-5H6v-2h5V6h2v5h5V13z"></path>
                            </g>
                        </svg>
                    </button>
             </div>`);
    }

    fetchProfileData(memberId) {
        const sales = this.isSales();
        const link = LINKEDIN_URL + (sales ? '' : '/in/') + memberId;

        return this.parser.getPageCodeElements(link)
            .then(pageContent => this.parser.findProfileJsonBlock(pageContent, sales))
            .then(jsonBlock => JSON.parse(jsonBlock))
            .catch(e => ({}));
    }

    openPreviewWindow(json) {
        console.log(json);
    }
}