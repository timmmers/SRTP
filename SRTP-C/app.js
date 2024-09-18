// app.js

// 引入SDK核心类，js文件根据自己业务，位置可自行放置
var QQMapWX = require("./libs/qqmap-wx-jssdk.js");

App({
  onLaunch() {
    const e = wx.getWindowInfo();
    this.globalData.StatusBar = e.statusBarHeight;
    let custom = wx.getMenuButtonBoundingClientRect();
    this.globalData.Custom = custom;
    // 宽度和高度都是以 px 为单位
    this.globalData.remainWidth = e.windowWidth;
    this.globalData.CustomBar = custom.bottom + custom.top - e.statusBarHeight;
    // 除去顶部和底部的导航栏的剩余高度
    this.globalData.remainHeight = e.windowHeight - this.globalData.CustomBar;
    // 除去了顶部的导航栏的剩余高度
    this.globalData.remainHeight2 = e.screenHeight - this.globalData.CustomBar;
    // 屏幕的高度
    this.globalData.remainHeight3 = e.screenHeight;
    // 初始化对象
    this.globalData.mapSdk = new QQMapWX({
      key: 'IKIBZ-4EX6M-QNA6J-6PPD4-D3GAT-KQBQA'
    });
  },

  // 获取当前定位
  getPosition(includeMore) {
    let result = {
      lat: 0.0,
      lng: 0.0,
      recommend_address: "",
      standard_address: ""
    };

    return new Promise((resolve, reject) => {
      wx.getLocation({
        type: 'gcj02',
        success: (res) => {
          // 获取到当前位置的经纬度
          result.lat = res.latitude, result.lng = res.longitude;
  
          if (!includeMore) {
            resolve(result);
          }
          
          // 查询当前经纬度的位置
          this.globalData.mapSdk.reverseGeocoder({
            location: {
              latitude: res.latitude,
              longitude: res.longitude
            },
            success: (res) => {
              result.recommend_address = res.result.formatted_addresses.recommend;
              result.standard_address = res.result.formatted_addresses.standard_address;
              resolve(result);
            }
          })
        },
        fail: (error) => {
          reject(error);
        }
      });
    });
  },

  /**
   * 发送一个请求给后端
   * @param method 请求类型, 只有 GET 和 POST
   * @param path 请求路径
   * @param header 请求头参数
   * @param body POST 是请求体, GET 是请求参数
   */
  sendRequest(method, path, header, body) {
    let url = "https://allowed-weasel-unlikely.ngrok-free.app" + path;

    if (header == null) { // 自定义请求头
      header = { "ngrok-skip-browser-warning": "YES", "Content-Type": "application/json" };
    } else {
      header['ngrok-skip-browser-warning'] = "YES";
      header['Content-Type'] = "application/json";
      header = JSON.stringify(header);
    }

    const requestInfo = {
      url: url,
      method: method,
      header: header
    };

    if (body != null) { // 如果请求方式是 POST, 则设置请求体
      requestInfo['data'] = body;
    }

    return new Promise((resolve, reject) => {
      requestInfo['success'] = (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else { // 即使返回码是 404 或者 500, 都会调用 success 回调函数
          reject(res);
        }
      };
      requestInfo['fail'] = (err) => {
        reject(err);
      };
      wx.request(requestInfo);
    });
  },

  // 全局变量
  globalData: {
    userInfo: null,
    secretKey: "d81e075a1c51b9470b1a5d1cd00c6eb6",
    appKey: "wxca76ebfdd6d49f5b",
  }
})
