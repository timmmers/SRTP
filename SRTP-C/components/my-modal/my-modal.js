// components/my-modal/my-modal.js
Component({

  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    title: {
      type: String,
      value: '提示'
    },
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    closeModal() {
      this.setData({ show: false });
      this.triggerEvent('close');
    },
    preventTouchMove() {
      // 阻止触摸事件的传播
    }
  }
})