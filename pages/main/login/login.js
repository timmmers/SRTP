// pages/main/login/login.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    bgHeight: 0,
    bgWidth: 0,
    halfHeight: 0,
    pageHeight: 0,
  },

  //用户一键登录
  login() {
    wx.showLoading({
      title: '正在尝试登录中...',
    });

    const dealWithError = () => {
      wx.hideLoading();
      wx.showToast({
        title: '登录失败', // 要显示的提示内容
        icon: 'none',  // 图标类型，可以是 'success', 'loading', 'none'
        duration: 1000    // 提示的持续时间，单位为毫秒，默认为 1500
      });
    };

    wx.login({
      success: res => {
        const app = getApp();
        app.sendRequest("GET", "/user/login", null, { code: res.code })
        .then(data => {
          //将 JWT 存入缓存中，方便登录后的每一个后端请求使用
          wx.setStorage({
            key: 'jwt',
            data: data.jwt,
            fail: () => {
              console.error("登录后的 JWT 存入缓存中失败!");
            },
          });

          wx.hideLoading();

          wx.switchTab({ //一键登录成功后转到主页
            url: '/pages/main/index/index'
          });
        }).catch(err => {
          dealWithError();
        });
      },
      fail: dealWithError,
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const app = getApp();
    const query = wx.createSelectorQuery();
    query.select('#login').boundingClientRect((rect) => {
      if (rect) {
        const inputHeight = rect.height;
        this.setData({
          bgHeight: app.globalData.remainHeight2 / 2,
          bgWidth: app.globalData.remainWidth,
          halfHeight: inputHeight / 2 * (-1),
        })
      }
    }).exec();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})