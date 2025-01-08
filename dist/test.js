"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const job_controller_1 = require("./job/job-controller");
void (async () => {
    const url = 'http://37.27.100.59:10500';
    const accountAddress = 'ZxDRUz6LXxX6J69zSbHFLBKHfSgX15fbTErF1eYqnmeM16DZomKrxBGMFLdn8hHPANYemxcoXvKMqeD7dHBawg723A2Ldkx4G';
    const viewKey = '1ab5e6038ab6d8d5d9e9e4e6f59b585e2a1dc2e8c04550b7b50a396ca251ef06';
    const spendKey = '79bbc3cb7b134d55e768a3422c0c68fb84729bc22470e31c4a238ebda9f09105';
    const controller = new job_controller_1.JobController(url, accountAddress, viewKey, spendKey, 2968722);
    await controller.startJob();
    await controller.resync(2968722);
    const balanceObservable = controller.getBalanceObservable();
    const subscription = balanceObservable.subscribe(onBalanceChange => {
        console.log('Balance:', onBalanceChange);
    });
})();
//# sourceMappingURL=test.js.map