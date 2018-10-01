import '../../css/inject.css';
import { connection } from './connection';
import PageService from './pageService';


(function initialize() {
    const pageService = new PageService();

    pageService.initialize();
})();