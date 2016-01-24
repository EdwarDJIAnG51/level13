// Contains a list of messages to be shown in the log
define(
['ash', 'game/constants/LogConstants', 'game/vos/LogMessageVO'],
function (Ash, LogConstants, LogMessageVO) {
    var LogMessagesComponent = Ash.Class.extend({
	
		messages: [],
		messagesPendingMovement: [],
		
		constructor: function () {
			this.messages = [];
			this.messagesPendingMovement = [];
			this.hasNewMessages = true;
		},
			
		addMessage: function (logMsgID, message, replacements, values, visibleLevel, visibleSector, visibleInCamp) {
			var isPending = Boolean(visibleLevel || visibleSector || visibleInCamp);
			var newMsg = new LogMessageVO(logMsgID, message, replacements, values);
			
			if (!isPending) {
				this.addMessageImmediate(newMsg);
			} else {
				newMsg.setPending(visibleLevel, visibleSector, visibleInCamp);
				this.messagesPendingMovement.push(newMsg);
			}
		},
		
		addMessageImmediate: function (message) {
			this.hasNewMessages = true;
            var merged = this.getMergedMessage(message);
			var combined = this.combineMessagesCheck(merged);
			if (!combined) {
                this.messages.push(merged);
            }
		},
		
		removeMessage: function (message) {
			this.messages.splice(this.messages.indexOf(message), 1);
		},
		
		showPendingMessage: function (message) {
			// TODO why no work? message.setPendingOver();
			this.messagesPendingMovement.splice(this.messagesPendingMovement.indexOf(message), 1);
			this.addMessageImmediate(message);
		},
		
		combineMessagesCheck: function (newMsg) {
			var prevMsg = this.messages[this.messages.length-1];
			if (!prevMsg) return false;
			
			var isCombineTime = newMsg.time.getTime() - prevMsg.time.getTime() < 1000 * 60 * 5;
			if (isCombineTime) {
				// Combine with previous single message?
				if (!prevMsg.loadedFromSave && newMsg.message === prevMsg.message) {
					this.combineMessages(prevMsg, newMsg);
					return true;
				}
				
				// Combine with previous pair of messages?
				var prev2Msg = this.messages[this.messages.length - 2];
				if (prev2Msg && !prev2Msg.loadedFromSave && newMsg.message === prev2Msg.message && newMsg.replacements.length === 0) {
					var prev3Msg = this.messages[this.messages.length-3];
					if (!prev3Msg.loadedFromSave && prevMsg.message === prev3Msg.message) {
						this.combineMessages(prev2Msg, newMsg);
						this.combineMessages(prev3Msg, prevMsg);
						this.removeMessage(prevMsg);
						return true;
					}
				}
			}
			
			return false;
		},
		
		combineMessages: function (oldMsg, newMsg) {
			this.mergeReplacements(oldMsg, newMsg);
			oldMsg.time = newMsg.time;
			oldMsg.combined++;
			oldMsg.createText();
		},
        
        mergeReplacements: function (baseMsg, toAddMsg) {
            var oldVal;
			var newVal;
			for (var i = 0; i < baseMsg.values.length; i++) {
				oldVal = baseMsg.values[i];
				newVal = toAddMsg.values[i];
				if (typeof oldVal === 'number' && typeof newVal === 'number') {
					baseMsg.values[i] += newVal;
				} else {
					baseMsg.values[i] += ", " + newVal;
				}
			}
        },
        
        getMergedMessage: function (newMsg) {
			var prevMsg = this.messages[this.messages.length - 1];
			if (!prevMsg || prevMsg.loadedFromSave) return newMsg;
            
            var mergedMsgID;
            var prevMsg2 = this.messages[this.messages.length - 2];
            if (prevMsg2 && !prevMsg2.loadedFromSave)
                mergedMsgID = LogConstants.getMergedMsgID([newMsg, prevMsg, prevMsg2]);
            if (!mergedMsgID)
                mergedMsgID = LogConstants.getMergedMsgID([newMsg, prevMsg]);
            
            if (mergedMsgID) {
                var mergedText = LogConstants.getMergedMsgText(mergedMsgID);
                var mergedMsg = new LogMessageVO(mergedMsgID, mergedText);
                this.mergeReplacements(mergedMsg, prevMsg);
                this.mergeReplacements(mergedMsg, newMsg);
                return mergedMsg;
            }
            
            return newMsg;
        },
        
    });

    return LogMessagesComponent;
});
