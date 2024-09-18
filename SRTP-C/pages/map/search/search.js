// pages/map/search/search.js
// 引入SDK核心类
var QQMapWX = require('../../../libs/qqmap-wx-jssdk.js');
 
// 实例化API核心类
var qqmapsdk = new QQMapWX({
    key: 'IKIBZ-4EX6M-QNA6J-6PPD4-D3GAT-KQBQA' // 必填
});

Page({

  /**
   * 页面的初始数据
   */
  data: {
    suggestion: [],
    backfill: "", //输入框中的值
    index: -1  //被选中的场景的索引
  },
  //数据回填方法
  backfill: function (e) {
    var id = e.currentTarget.id;
    for (var i = 0; i < this.data.suggestion.length;i++){
      if(i == id){
        this.setData({
          backfill: this.data.suggestion[i].title,
          index: id
        });
      }
    }
  },

  //触发关键词输入提示事件
  getsuggest: function(e) {
    var _this = this;
    //调用关键词提示接口
    qqmapsdk.getSuggestion({
      //获取输入框值并设置keyword参数
      keyword: e.detail.value, //用户输入的关键词，可设置固定值,如keyword:'KFC'
      //region:'北京', //设置城市名，限制关键词所示的地域范围，非必填参数
      page_size: 20,//设置一页显示的提示数量
      success: function(res) {//搜索成功后的回调
        var sug = [];
        for (var i = 0; i < res.data.length; i++) {
          sug.push({ // 获取返回结果，放到sug数组中
            title: res.data[i].title,
            id: res.data[i].id,
            addr: res.data[i].address,
            city: res.data[i].city,
            district: res.data[i].district,
            latitude: res.data[i].location.lat,  //纬度
            longitude: res.data[i].location.lng  //经度
          });
        }
        _this.setData({ //设置suggestion属性，将关键词搜索结果以列表形式展示
          suggestion: sug,
          index: -1  //每当输入框删除或者新添一个字时，需要重置index值
        });
      },
      fail: function(error) {
        console.error(error);
      }
    });
  },
  onClickButton() {
    if (this.data.backfill.length == 0 || this.data.index == -1){
      wx.showToast({
        title: this.data.backfill.length == 0 ? '请输入提示词' : '请选择一个提示',
        image: "/map-icons/attention.png",
        duration: 1000
      })
    } else {
      //将数据传给地图页面
      wx.navigateBack({
        delta: 1, // 要返回的页面数，默认值为 1
        success: () => {
          // 获取当前页面栈
          const pages = getCurrentPages();
          const previousPage = pages[pages.length - 1]; // 上一个页面
      
          // 调用上一个页面的方法来更新数据
          if (previousPage && previousPage.redirectToPoint) {
            previousPage.redirectToPoint(this.data.suggestion[this.data.index]); // 传递的数据
          }
        }
      });
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const app = getApp();
    const query = wx.createSelectorQuery();
    query.select('#input').boundingClientRect((rect) => {
      if (rect) {
        const inputHeight = rect.height; // 获取 input 的高度
        // 动态设置 scroll-view 的高度
        this.setData({
          remainHeight: app.globalData.remainHeight2,
          scrollHeight: app.globalData.remainHeight2 - inputHeight,
        });
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