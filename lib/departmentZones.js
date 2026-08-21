'use strict';

const DEPARTMENT_TO_SCHOOL_ZONE = require('./departmentZones.json');
const DOM_DEPARTMENT_TO_HOLIDAY_REGION = require('./domHolidayRegions.json');

/**
 * Normalize INSEE department codes from geo.api.gouv.fr.
 * Numeric codes are zero-padded to 2 or 3 digits; Corsica stays 2A/2B.
 */
function normalizeDepartmentCode(department) {
  if (department == null || department === '') return null;
  const raw = String(department).trim().toUpperCase();
  if (!raw) return null;
  if (/^\d+$/.test(raw)) {
    if (raw.length <= 2) return raw.padStart(2, '0');
    return raw;
  }
  return raw;
}

function getSchoolZoneFromDepartment(department) {
  const code = normalizeDepartmentCode(department);
  if (!code) return null;
  return DEPARTMENT_TO_SCHOOL_ZONE[code] || null;
}

function getHolidayRegionFromDepartment(department) {
  const code = normalizeDepartmentCode(department);
  if (!code) return 'metropole';
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
  normalizeDepartmentCode,
  getSchoolZoneFromDepartment,
  getHolidayRegionFromDepartment,
};
