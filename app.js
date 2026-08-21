'use strict';

const Homey = require('homey');
const DayInfoService = require('./lib/DayInfoService');
const { DEFAULT_SETTINGS } = require('./lib/constants');
const { msUntilNextParisTime } = require('./lib/dateUtils');

module.exports = class DayInfoApp extends Homey.App {

  async onInit() {
    this.log('French School Holidays app initializing');

    this._ensureDefaultSettings();
    this.dayInfo = new DayInfoService(this.homey, this.log.bind(this), this.error.bind(this));

    this._registerFlowCards();
    this._scheduleDailyUpdate();
    this._registerSettingsListener();

    try {
      await this.dayInfo.refreshCache();
      await this._fireTodayTriggers();
    } catch (err) {
      this.error('Initial update failed:', err.message);
      try {
        await this._fireTodayTriggers();
      } catch (innerErr) {
        this.error('Fallback update failed:', innerErr.message);
      }
    }

    this.log('French School Holidays app ready');
  }

  _ensureDefaultSettings() {
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      if (this.homey.settings.get(key) === undefined) {
        this.homey.settings.set(key, value);
      }
    }
  }

  async runDailyUpdate() {
    try {
      await this.dayInfo.refreshCache();
    } catch (err) {
      this.error('Cache refresh failed:', err.message);
    }

    await this.dayInfo.update();
    await this._dispatchTriggers();
  }

  async _fireTodayTriggers() {
    await this.dayInfo.update();
    await this._dispatchTriggers();
  }

  async _dispatchTriggers() {
    const tokens = this.dayInfo.buildFlowTokens();
    const changes = this.dayInfo.detectChanges();
    const snapshot = this.dayInfo.getSnapshot();
    const today = snapshot.date;

    for (const change of changes) {
      await this._triggerCard(change.type, tokens);
      this.dayInfo.markTriggered(change.type, today);
    }

    await this._fireCountdownTriggers(snapshot, tokens, today);
  }

  async _fireCountdownTriggers(snapshot, tokens, today) {
    const { daysUntilNext: daysUntilStart, daysUntilEnd, isActive } = snapshot.schoolHoliday;
    if (daysUntilStart != null && daysUntilStart >= 1) {
      const key = `school_holiday_starts_in:${daysUntilStart}`;
      if (!this.dayInfo._wasTriggeredToday(key, today)) {
        await this._triggerCardWithState('school_holiday_starts_in', tokens, { days: daysUntilStart });
        this.dayInfo.markTriggered(key, today);
      }
    }

    if (isActive && daysUntilEnd != null && daysUntilEnd >= 1) {
      const key = `school_holiday_ends_in:${daysUntilEnd}`;
      if (!this.dayInfo._wasTriggeredToday(key, today)) {
        await this._triggerCardWithState('school_holiday_ends_in', tokens, { days: daysUntilEnd });
        this.dayInfo.markTriggered(key, today);
      }
    }
  }

  async getDaySummary() {
    return this.dayInfo.getSummary();
  }

  async syncData() {
    await this.dayInfo.refreshCache({ force: true });
    await this.dayInfo.update();
    return { lastSyncAt: this.homey.settings.get('lastSyncAt') };
  }

  async suggestZone() {
    return this.dayInfo.geoZoneService.suggestZones();
  }

  _registerSettingsListener() {
    this.homey.settings.on('set', (key) => {
      if (key === 'schoolZone' || key === 'holidayRegion') {
        this.dayInfo.refreshCache({ force: true })
          .then(() => this.dayInfo.update())
          .catch(this.error);
      } else if (key === 'labelLanguage') {
        this.dayInfo.update().catch(this.error);
      }
    });
  }

  _scheduleDailyUpdate() {
    const runAndScheduleNext = () => {
      this.runDailyUpdate().catch(this.error);
      this._scheduleNextDailyRun();
    };

    const delay = msUntilNextParisTime(0, 5, 0);
    this._dailyTimeout = this.homey.setTimeout(runAndScheduleNext, delay);
  }

  _scheduleNextDailyRun() {
    const delay = msUntilNextParisTime(0, 5, 0);
    this._dailyTimeout = this.homey.setTimeout(() => {
      this.runDailyUpdate().catch(this.error);
      this._scheduleNextDailyRun();
    }, delay);
  }

  async _triggerCard(id, tokens) {
    try {
      const card = this.homey.flow.getTriggerCard(id);
      await card.trigger(tokens);
    } catch (err) {
      this.error(`Trigger ${id} failed:`, err.message);
    }
  }

  async _triggerCardWithState(id, tokens, state) {
    try {
      const card = this.homey.flow.getTriggerCard(id);
      await card.trigger(tokens, state);
    } catch (err) {
      this.error(`Trigger ${id} failed:`, err.message);
    }
  }

  _schoolHolidayForWhen(snapshot, when) {
    const sh = snapshot.schoolHoliday;
    if (when === 'yesterday') {
      return { active: sh.isActiveYesterday, label: sh.yesterdayLabel, type: sh.yesterdayType };
    }
    if (when === 'tomorrow') {
      return { active: sh.isActiveTomorrow, label: sh.tomorrowLabel, type: sh.tomorrowType };
    }
    return { active: sh.isActive, label: sh.currentLabel, type: sh.currentType };
  }

  _publicHolidayForWhen(snapshot, when) {
    const ph = snapshot.publicHoliday;
    if (when === 'yesterday') {
      return { active: ph.isHolidayYesterday, label: ph.yesterdayLabel };
    }
    if (when === 'tomorrow') {
      return { active: ph.isHolidayTomorrow, label: ph.tomorrowLabel };
    }
    return { active: ph.isHoliday, label: ph.label };
  }

  _registerFlowCards() {
    this.homey.flow.getConditionCard('is_public_holiday')
      .registerRunListener(async (args) => {
        const snapshot = await this.dayInfo.getSummary();
        return this._publicHolidayForWhen(snapshot, args.when || 'today').active;
      });

    this.homey.flow.getConditionCard('is_school_holiday')
      .registerRunListener(async (args) => {
        const snapshot = await this.dayInfo.getSummary();
        return this._schoolHolidayForWhen(snapshot, args.when || 'today').active;
      });

    this.homey.flow.getConditionCard('school_holiday_type_is')
      .registerRunListener(async (args) => {
        const snapshot = await this.dayInfo.getSummary();
        const info = this._schoolHolidayForWhen(snapshot, args.when || 'today');
        return info.active && info.type === args.type;
      });

    this.homey.flow.getConditionCard('days_until_school_holiday_lte')
      .registerRunListener(async (args) => {
        const snapshot = await this.dayInfo.getSummary();
        const days = snapshot.schoolHoliday.daysUntilNext;
        if (days === null) return false;
        return days <= args.days;
      });

    this.homey.flow.getConditionCard('days_until_school_holiday_end_lte')
      .registerRunListener(async (args) => {
        const snapshot = await this.dayInfo.getSummary();
        const days = snapshot.schoolHoliday.daysUntilEnd;
        if (!snapshot.schoolHoliday.isActive || days === null) return false;
        return days <= args.days;
      });

    this.homey.flow.getConditionCard('days_until_public_holiday_lte')
      .registerRunListener(async (args) => {
        const snapshot = await this.dayInfo.getSummary();
        const days = snapshot.publicHoliday.daysUntilNext;
        if (days === null) return false;
        return days <= args.days;
      });

    this.homey.flow.getTriggerCard('school_holiday_starts_in')
      .registerRunListener(async (args, state) => Number(args.days) === Number(state.days));

    this.homey.flow.getTriggerCard('school_holiday_ends_in')
      .registerRunListener(async (args, state) => Number(args.days) === Number(state.days));
  }

  onUninit() {
    if (this._dailyTimeout) this.homey.clearTimeout(this._dailyTimeout);
  }

};
