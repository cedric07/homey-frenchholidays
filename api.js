'use strict';

module.exports = {
  async getSummary({ homey }) {
    return homey.app.getDaySummary();
  },

  async sync({ homey }) {
    return homey.app.syncData();
  },

  async suggestZone({ homey }) {
    return homey.app.suggestZone();
  },
};
