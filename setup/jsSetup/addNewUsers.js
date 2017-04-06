#!/usr/bin/env node

'use strict';

const VDM = require('../../../VDM/prototypes/vdm');
const vdmUtils = require('../../../VDM/prototypes/vdmUtils');
const testUtils = require('../../../VDM/prototypes/testUtils');
const vdmNonClinicalModel = require('./vdmNewPersonModel').vdmModel;
const _ = require('lodash');
const fs = require('fs');
const nodem = require('nodem');
const util = require('util');

// todo: point this to mvdm
// todo: move this non-clinical
// sets the path for all mumps GT.M routines (compiled .m files)
process.env.gtmroutines = `${process.env.gtmroutines} ${vdmUtils.getVdmPath()}`;

const db = new nodem.Gtm();
db.open();

// prevent incomplete exit on exception - always close db
process.on('uncaughtException', (err) => {
    db.close();
    console.log('Uncaught Exception:\n', err);
    process.exit(1);
});

// Util function to print full obj tree
const printResult = function printResult(obj) {
    console.log(util.inspect(obj, {
        depth: null,
        colors: true,
    }));
};

// Check if the the user has minimum required field for fileman to create a new user
const hasMinumumFields = function hasMinumumFields(user) {
    const minimumFieldToCreate = ['name', 'type', 'initial'];
    return !_.some(minimumFieldToCreate, (field) => {
        if (!_.has(user, field)) {
            console.log(`unable to proceed, user ${user.name} missing required '${field}' field to create!`);
            return true;
        }
    });
};

// Filemans allow to update the following fields with no error
// We first use first level field below to create a user record and then update the level/depth(2) data via VDM update
const allowedFields = ['name', 'sex', 'ssn', 'type', 'service_section', 'initial', 'service_section',
    'terminal_type_last_used', 'signature_block_printed_name', 'electronic_signature_code',
    'file_manager_access_code', 'service_section', 'preferred_editor', 'effective_date', 'access_code', 'verify_code',
    'keys', 'primary_menu_option', 'secondary_menu_options', 'cprs_tab', 'person_class', 'division', 'multiple_signon',
    'restrict_patient_selection',
];

VDM.setDBAndModel(db, vdmNonClinicalModel);
const userId = testUtils.lookupUserIdByName(db, 'MANAGER,SYSTEM'); // TODO: make this Manager,System
const facilityId = testUtils.lookupFacilityIdByName(db, 'VISTA HEALTH CARE');
VDM.setUserAndFacility(userId, facilityId); // must setup user (DUZ) when creating ELSE creator is 0

// Read input JSON object from file (getUsersRecord.js)
const usersRecord = JSON.parse(fs.readFileSync('./data.json', 'utf8'));


if (_.every(usersRecord, hasMinumumFields)) { // getUsersRecord.js should have already checked this
    _.each(usersRecord, (user) => {
        const person = {};

        // allowedFields & acceptedUpdatedFields can be combined into one array
        _.each(allowedFields, (field) => {
            if (user[field]) {
                // keep this in case we need to do this for mass import
                // person.access_code = `${user.initial}1234`;
                // person.verify_code = `${user.initial}1234!!`;
                person[field] = user[field];
            } else {
                console.log(`** Warning: User ${user.name} missing ${field}, update will continue...`);
            }
        });

        const res = VDM.create(person);
        if (res.id) console.log(`${person.name} (${res.id}) created!!`);
    });
}

db.close();