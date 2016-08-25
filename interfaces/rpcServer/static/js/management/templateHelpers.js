/*global define*/
define([
   'handlebars'
], function (Handlebars) {
   'use strict';

   Handlebars.registerHelper('emulation-select', function(management) {

      if (!management) {
         return;
      }

      function setSelected(management, optionValue) {
         if ((management.isEmulation && optionValue === 'on') ||
            (!management.isEmulation && optionValue === 'off')) {
            return ' selected';
         }

         return '';
      }

      var selectHtml = '<select class="form-control emulation-select">';
      selectHtml += '<option value="on"' + setSelected(management, 'on') + '>On</option>';
      selectHtml += '<option value="off"' + setSelected(management, 'off') + '>Off</option>';
      selectHtml += '</select>';

      return new Handlebars.SafeString(selectHtml);
   });
});