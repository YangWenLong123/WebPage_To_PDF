/*
 * @Author: along
 * @Date: 2022-04-28 10:28:25
 * @,@LastEditTime: ,: 2022-05-30 22:28:40
 * @,@LastEditors: ,: Please set LastEditors
 * @Description: 接口业务逻辑
 * @FilePath: /edc_pdf_generator/src/fileservice/app.service.ts
 */

import { Injectable } from '@nestjs/common';
const puppeteer = require('puppeteer');
import { Request, Response } from 'express';
import { globalService } from '../utils/global.service';
import { creatBrowser } from '../utils/browser.server';
// const request2 = require('request');

@Injectable()
export class AppService {
  pdfHandler(request: Request, response: Response) {
    console.log('headers', request.headers);
    console.log('开始处理' + Date.now());
    console.log('主进程id', process.pid);

    // let token = '';
    const url = 'https://juejin.cn/';
    // const domain = '';

    (async () => {
      //从连接池里获取浏览器实例
      let tmp = Math.floor(Math.random() * globalService.MAX_WSE);
      let browserWSEndpoint = globalService.WSE_LIST[tmp];

      //连接浏览器
      const browser = await puppeteer.connect({ browserWSEndpoint });

      //打开tab页
      const page = await browser.newPage();

      //设置页面cookie
      // await page.setCookie({
      //   name: 'PDF-Token',
      //   value: token,
      //   domain: domain
      // });

      //最大超时时间
      await page.setDefaultNavigationTimeout(0);

      //导出pdf配置项
      const pdfConfig = {
        format: 'A4', //A4纸
        width: '794px',
        height: '1123px',
        headerTemplate: '', //页头
        footerTemplate: '', //页尾
        margin: {
          top: '60px', //上边距
          bottom: '100px', //下边距
          right: 0,
          left: 0
        },
        scale: 1,
        displayHeaderFooter: false, //是否显示页眉页脚
        printBackground: true //打印背景色
      };

      try {
        const requertUrl = url;

        try {
          await page.goto(`${requertUrl}`, {
            waitUntil: 'networkidle2'  //考虑在至少500ms内没有超过 2 个网络连接时完成导航
          });

        //   const checkDom = await page.waitFor(
        //     () => !!document.getElementById('#acrf_body'),
        //   );
        //   console.log('查询元素', checkDom._remoteObject.value);

          const pdfBuffer = await page.pdf({
            ...pdfConfig,
          });

          const base64 = pdfBuffer.toString('base64');

          response.set({
            'Content-Type': 'application/pdf'
          })
          response.send(pdfBuffer);

        //   response.json({
        //     pdf: base64,
        //     form_status_id: form_status_id
        //   });

          // await browser.close(); //关闭浏览器

          await page.close(); //关闭tab

          let pageNum = await browser.pages();

          console.log('当前tab页数量:', pageNum.length);

          console.log(
            (page.isClosed()
              ? '执行完毕,关闭tab页面'
              : '执行完毕,未关闭tab页面') + Date.now(),
          );
        } catch (error) {
          await page.close(); //关闭tab

          //关闭浏览器
          for (let i = 0; i < globalService.WSE_LIST.length; i++) {
            let browserWsEndpoint2 = globalService.WSE_LIST[i];

            const browser2 = await puppeteer.connect({ browserWsEndpoint2 });

            await browser2.close();
          }

          new creatBrowser(); // 重启浏览器
        }
      } catch (error) {
        response.status(500);
      }
    })();
  }
}
