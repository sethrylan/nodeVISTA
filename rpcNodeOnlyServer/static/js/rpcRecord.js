/*global define*/
define([
   'jquery',
   'underscore',
   'backbone',
   'eventBus',
   'jsBeautify'
], function ($, _, Backbone, EventBus, jsBeautify) {
   'use strict';

   var RPCRecord = function() {
      _.extend(this, Backbone.Events);

      this.listenTo(EventBus, 'newRpcEvent', function(event) {
         if (this.recordSession) {
            this.rpcSession.sequence.push(
               {
                  name: event.get('rpcName'),
                  args: event.get('request').args,
                  response: event.get('response'),
                  runner: event.get('runner'),
                  runResult: event.get('runResult'),
                  from: event.get('rpcObject').from,
                  transactionId: event.get('transactionId'),
                  timestamp: event.get('timestamp')
               }
            );
         }
      });

      this.start = function() {
         this.rpcSession = {
            description: '', //placeholder
            comment: '', //placeholder
            sequence: []
         };

         this.recordSession = true;
      };

      this.stop = function() {
         this.recordSession = false;
      };

      this.getSessionOutput = function() {
         return jsBeautify.js_beautify(JSON.stringify(this.rpcSession));
      }
   };

   return RPCRecord;
});