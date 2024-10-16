// pages/map/search/search.js
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    suggestion: [],
    backfill: "", //输入框中的值
    index: -1,  //被选中的场景的索引
    typesDesc: ["动物园区", "游乐休息", "店铺", "公共厕所", "出入口"],
    regions: []
  },
  //数据回填方法
  backfill: function (e) {
    var id = e.currentTarget.id;
    for (var i = 0; i < this.data.suggestion.length;i++){
      if(i == id){
        this.setData({
          backfill: this.data.suggestion[i].name,
          index: id
        });
      }
    }
  },

  getSuggestByType: function(e) {
    const type = e.currentTarget.dataset.type + 1;
    const sug = this.data.regions.filter(item => item.type == type);
    this.setData({
      suggestion: sug,
      index: -1
    })
  },

  getSuggest: function(e) {
    const keyword = e.detail.value;
    const regions = this.data.regions;
    if (keyword && keyword != '') {
      const sug = [];
      for (let i = 0; i < regions.length; ++i) {
        if (regions[i].name.includes(keyword)) {
          sug.push(regions[i]);
        }
      }
      this.setData({
        index: -1,
        suggestion: sug
      });
    } else if (keyword == '') {
      this.setData({
        index: -1,
        suggestion: []
      });
    }
  },

  onClickButton() {
    if (this.data.backfill.length == 0 || this.data.index == -1){
      wx.showToast({
        title: this.data.backfill.length == 0 ? '请输入提示词' : '请选择一个提示',
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
    const query = wx.createSelectorQuery();
    this.setData({
      remainHeight: app.globalData.remainHeight2,
      scrollHeight: app.globalData.remainHeight2
    });
    query.select('#input').boundingClientRect((rect) => {
      if (rect) {
        const inputHeight = rect.height; // 获取 input 的高度
        // 动态设置 scroll-view 的高度
        this.setData({
          scrollHeight: this.data.scrollHeight - inputHeight
        });
      }
    }).exec();
    query.select('#type').boundingClientRect((rect) => {
      if (rect) {
        const inputHeight = rect.height; // 获取 type 的高度
        // 动态设置 scroll-view 的高度
        this.setData({
          scrollHeight: this.data.scrollHeight - inputHeight
        });
      }
    }).exec();
    const types = this.data.typesDesc.map((item, idx) => {
      return {
        src: '/map-icons/search/' + (idx + 1) + '.png',
        txt: item
      };
    });
    this.setData({ types: types })
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
    wx.showLoading({
      title: '加载中...',
    })
    app.sendRequest('GET', '/user/regions/all/get', null, null).then(res => {
      if (res.code == 200) {
        const typesDesc = this.data.typesDesc;
        const regions = res.data.map(item => {
          item['typeDesc'] = typesDesc[item.type - 1];
          return item;
        });
        this.setData({ regions: regions });
      } else {
        console.error(res.msg);
      }
    }).finally(() => {
      wx.hideLoading();
    });
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