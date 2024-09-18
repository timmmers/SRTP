// pages/map/index/index.js
import {zoo_points, new_points} from "../../../utils/zoo-point";
Page({

  /**
   * 页面的初始数据
   */
  data: {
    lat: 0.0,
    lng: 0.0,
    markers: [],
    isHidden: false, // 是否隐藏屏幕中心的点标记
    startIdx: -1, // 起点位置在 markers 中的索引
    endIdx: -1, // 终点位置在 markers 中的索引
    targetIdx: -1, // 地图目标点在 markers 中的索引
    uniqueID: 1,  // 设置一个自增的唯一 ID, 给地图中出现的每一个点的 id 属性赋值
    polygons: null,
  },

  createID() {
    let id = this.data.uniqueID;
    this.setData({
      uniqueID: id + 1,
    });
    return id;
  },

  createNewMarker() {
    const idx = this.createID();
    return {
      id: idx,
      callout: {
        content: "目标点",
        display: "ALWAYS",
        color: "#1e63e9",
        padding: 5,
        borderRadius: 4,
        fontSize: 15
      },
      latitude: 0,
      longitude: 0,
      iconPath: "/map-icons/target.png",
      anchor: {
        x: 0.5,
        y: 0.8
      },
      width: 35,
      height: 35
    };
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const app = getApp();
    const points = zoo_points.map(item => {
      return {latitude: item.lat, longitude: item.lng}
    });

    const query = wx.createSelectorQuery();
    query.select('#designBtn').boundingClientRect((rect) => {
      if (rect) {
        this.setData({
          halfHeight1: (app.globalData.remainWidth - rect.width) / 2,
        })
      }
    }).exec();
    
    query.select('#targetIcon').boundingClientRect((rect) => {
      if (rect) {
        this.setData({
          centerX: (app.globalData.remainWidth - rect.width) / 2,
          centerY: app.globalData.CustomBar + app.globalData.remainHeight * 0.5 - rect.height * 0.8,
          isHidden: true
        })
      }
    }).exec();

    this.setData({
      lat: points[0].latitude,
      lng: points[0].longitude,
      remainHeight: app.globalData.remainHeight, // 设置地图的高度为屏幕剩余高度
      polygons: [{
        points: points,
        strokeWidth: 3,
        strokeColor: "#22c505",
        fillColor: "#08a4f620"
      }],
    });
  },

  /**
   * 刷新用户当前的定位
   */
  refreshPosition() {
    // 显示加载中提示
    wx.showLoading({
      title: '加载中...',
    });

    const app = getApp();
    app.getPosition(false).then(data => {
      this.setData({
        lat: data.lat,
        lng: data.lng
      })
    }).catch(error => {
      console.log("获取定位时出现错误: " + error);
    }).finally(() => {
      // 隐藏加载中提示
      wx.hideLoading();
    });
  },

  showCenter(e) {
    let mks = this.data.markers;
    if (e.type == "begin") {
      mks = mks.length == 0 ? mks : mks.filter(item => item.id != this.data.targetIdx);
      this.setData({
        markers: mks,
        isHidden: false,
        targetIdx: -1
      });
    } else if (e.type == "end") {
      const point = this.createNewMarker();
      point.latitude = e.detail.centerLocation.latitude;
      point.longitude = e.detail.centerLocation.longitude;
      mks.push(point);
      this.setData({
        markers: mks,
        isHidden: true,
        targetIdx: point.id,
      });
    }
  },

  decideStartOrEnd(e) {
    const isStart = e.currentTarget.dataset.type == "start";
    const idx = isStart ? this.data.startIdx : this.data.endIdx;
    if (idx == -1 && this.data.targetIdx == -1) { // 地图尚未移动, 还没有目标点, 不能设置起点或终点
      wx.showModal({
        title: '注意',
        content: '此时尚未有目标点，请移动屏幕选取目标点',
        showCancel: false,
        confirmText: "确定"
      });
    }
    else if (idx == -1) { // 可以设置起点或终点
      let mks = this.data.markers;
      mks = mks.map(item => {
        if (item.id == this.data.targetIdx) {
          item.iconPath = "/map-icons/" + e.currentTarget.dataset.type + "-point.png";
          item.anchor = {
            x: 0.5,
            y: 0.5
          };
          item.callout.content = isStart ? "起点" : "终点";
          item.callout.color = isStart ? "#14d8ce" : "#d81e06";
          item.callout.fontSize = 15;
        }
        return item;
      });
      // 修改地图的点数据
      const temp = this.data.targetIdx;
      let result = {markers: mks, targetIdx: -1};
      isStart ? result.startIdx = temp : result.endIdx = temp;
      this.setData(result);
    }
    else { // 已经设置起点或终点
      let mks = this.data.markers;
      mks = mks.filter(item => item.id != idx);
      let result = {markers: mks};
      isStart ? result.startIdx = -1 : result.endIdx = -1;
      this.setData(result);
    }
  },

  decideMid() {
    if (this.data.targetIdx == -1) {
      wx.showModal({
        title: '注意',
        content: '此时尚未有目标点，请移动屏幕选取目标点',
        showCancel: false,
        confirmText: "确定"
      });
    } else {
      let mks = this.data.markers;
      mks = mks.map(item => {
        if (item.id == this.data.targetIdx) {
          item.iconPath = "/map-icons/mid-point.png";
          item.anchor = {
            x: 0.5,
            y: 0.5
          };
          item.callout.content = "途径点" + item.id;
          item.callout.color = "#6523db";
          item.callout.fontSize = 15;
        }
        return item;
      });
      // 修改地图的点数据
      let result = {markers: mks, targetIdx: -1};
      this.setData(result);
    }
  },

  handleTouchStart(e) {
    this.setData({
      touchStartTime: e.timeStamp
    });
  },

  handleTouchEnd(e) {
    const touchDuration = e.timeStamp - this.data.touchStartTime;
    if (touchDuration >= 500) {
      // 长按 0.5 秒, 显示出已选择的途径点列表
      this.setData({ showModal: true });
    } else {
      // 直接点击, 即选择该点为途径点
      this.decideMid();
    }
  },

  closeMyModal() {
    this.setData({ showModal: false });
  },

  goToSearch() {
    wx.navigateTo({
      url: "/pages/map/search/search" // 目标页面的路径
    });
  },

  showTip() {
    const tipList = [
      "1.点击起点按钮, 会标记当前目标点为起点, 再次点击, 会取消起点标记(终点按钮也是一样)",
      "2.点击靶子按钮, 会标记当前目标点为途径点, 长按超过0.5秒, 会显示已选择的途径点列表"
    ];

    wx.showModal({
      title: "地图操作提示",
      content: tipList.join("\n"),
      showCancel: false,
      confirmText: "确定"
    });
  },

  deletePoint(e) {
    const idx = e.currentTarget.dataset.index;
    let mks = this.data.markers;
    mks = mks.filter(item => item.id != idx);
    let result = {markers: mks, showModal: false};
    if (idx == this.data.startIdx) {
      result.startIdx = -1;
    } else if (idx == this.data.endIdx) {
      result.endIdx = -1;
    } else if (idx == this.data.targetIdx) {
      result.targetIdx = -1;
    }
    this.setData(result);
  },

  redirectToPoint(obj) {
    console.log(obj);
    const mks = this.data.markers;
    const result = { 
      markers: mks,
      targetIdx: -1,
      isHidden: true,
      lat: obj.latitude,
      lng: obj.longitude,
    };
    let point;
    if (this.data.targetIdx == -1) {
      point = this.createNewMarker();
      mks.push(point);
    } else {
      point = mks.filter(item => item.id == this.data.targetIdx)[0];
    }
    point.latitude = obj.latitude;
    point.longitude = obj.longitude;
    point.callout.content = obj.title;
    result.targetIdx = point.id;
    this.setData(result);
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