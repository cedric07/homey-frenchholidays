'use strict';

const DEPARTMENT_TO_SCHOOL_ZONE = require('./departmentZones.json');
const DOM_DEPARTMENT_TO_HOLIDAY_REGION = require('./domHolidayRegions.json');

function getSchoolZoneFromDepartment(department) {
  if (!department) return null;
  const code = String(department).toUpperCase();
  return DEPARTMENT_TO_SCHOOL_ZONE[code] || null;
}

function getHolidayRegionFromDepartment(department) {
  const code = String(department);
  if (DOM_DEPARTMENT_TO_HOLIDAY_REGION[code]) {
    return DOM_DEPARTMENT_TO_HOLIDAY_REGION[code];
  }
  if (code === '67' || code === '68' || code === '57' || code === '90') {
    return 'alsace-moselle';
  }
  return 'metropole';
}

module.exports = {
  DEPARTMENT_TO_SCHOOL_ZONE,
  getSchoolZoneFromDepartment,
  getHolidayRegionFromDepartment,
};
