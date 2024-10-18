// app.js

// 引入SDK核心类，js文件根据自己业务，位置可自行放置
const QQMapWX = require("./libs/qqmap-wx-jssdk.js");

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
    // 引入微信同声传译插件
    this.globalData.plugin = requirePlugin('WechatSI');
    // 创建播放背景音乐的对象
    const musicManager = wx.createInnerAudioContext();
    this.globalData.musicManager = musicManager;
    musicManager.src = this.globalData.url + '/resource/music/NewWorld.mp3';
    musicManager.loop = true;
    musicManager.play();
    // 创建一个用于导航时语言播报的对象
    const audioManager = wx.createInnerAudioContext();
    this.globalData.audioManager = audioManager;
    audioManager.onEnded(() => {
      musicManager.play();
    });
  },

  onShow() {
    // 当小程序进入前台，继续播放音乐
    this.globalData.musicManager.play();
  },

  onHide() {
    // 当小程序进入后台，暂停音乐
    this.globalData.musicManager.pause();
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
   * 获取两点间的一条路线
   * @param start 起点经纬度
   * @param end 终点经纬度
   */
  getPath(start, end) {
    const qqmapsdk = this.globalData.mapSdk;
    return new Promise((resolve, reject) => {
      // 调用距离计算接口
      qqmapsdk.direction({
        mode: 'walking', // 选择步行的方式
        from: start,  // 起点
        to: end,  // 终点
        success: function (res) {
          let coors = res.result.routes[0].polyline, pl = [];
          //坐标解压（返回的点串坐标，通过前向差分进行压缩）
          const kr = 1000000;
          for (let i = 2; i < coors.length; ++i) {
            coors[i] = Number(coors[i - 2]) + Number(coors[i]) / kr;
          }
          //将解压后的坐标放入点串数组pl中
          for (let i = 0; i < coors.length; i += 2) {
            pl.push({ latitude: coors[i], longitude: coors[i + 1] })
          }
          resolve({
            polyline: pl,
            duration: res.result.routes[0].duration,
            distance: res.result.routes[0].distance
          });
        },
        fail: (err) => {
          reject(err);
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
    let url = this.globalData.url + path;

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

  /**
   * 进行语音合成，将文本转成 MP3 格式的语音
   * @param text 文本
   * @returns 音频的链接
   */
  txtToAudio(text) {
    const plugin = this.globalData.plugin;
    return new Promise((resolve, reject) => {
      plugin.textToSpeech({
        lang: "zh_CN",
        tts: true,
        content: text,
        success: (res) => {
          resolve(res.filename);
        },
        fail: () => {
          reject("语言合成文本\"" + text + "\"失败");
        }
      });
    });
  },

  /**
   * 播放一段音频
   * @param src 音频文件的链接
   */
  playAudio(src) {
    const audioManager = this.globalData.audioManager;
    if (audioManager.paused == false) {
      return false;
    }
    const musicManager = this.globalData.musicManager;
    musicManager.pause();
    audioManager.src = src;
    audioManager.play();
    return true;
  },

  getDistanceOf(from, to) {
    const toRad = (degree) => degree * Math.PI / 180;
    // 地球半径，单位米
    const R = 6371000;

    // 将经纬度转换为弧度
    const φ1 = toRad(from.latitude);
    const φ2 = toRad(to.latitude);
    const Δφ = toRad(to.latitude - from.latitude);
    const Δλ = toRad(to.longitude - from.longitude);

    // Haversine 公式
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // 计算距离，单位为米
    return R * c;
  },

  // 全局变量
  globalData: {
    userInfo: null,
    secretKey: "d81e075a1c51b9470b1a5d1cd00c6eb6",
    appKey: "wxca76ebfdd6d49f5b",
    url: "https://moved-dove-vaguely.ngrok-free.app"
  }
})
