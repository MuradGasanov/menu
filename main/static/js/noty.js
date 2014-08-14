if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) {
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

(function($) {
    $(function (e) {
        window.k_noti = $("#k-notification").kendoNotification({
            position: {
                pinned: true,
                top: 30,
                right: 30
            },
            autoHideAfter: 0,
            stacking: "down",
            templates: [
                {
                    type: "error",
                    template: $("#errorTemplate").html()
                },
                {
                    type: "wait",
                    template: $("#waitTemplate").html()
                },
                {
                    type: "done",
                    template: $("#doneTemplate").html()
                },
                {
                    type: "alert",
                    template: $("#alertTemplate").html()
                }
            ],
            show: function (e) {
                var elm = e.element;
                if (elm.children().attr("class") !== "alert-noti") {
                    var margin = "-{0}px 0 0 -{1}px".format(
                        Math.floor(elm.height() / 2),
                        Math.floor(elm.width() / 2)
                    );
                    elm.parent().css({left: "50%", top: "50%", margin: margin});
                }
            }
        }).data("kendoNotification");


        var last_time_out_id = 0;

        window.noti = function(option, type, time) {
            if ((option === "hide") || (typeof option === 'undefined')) {
                k_noti.hide();
                return false;
            }
            if (type === "alert") {
                k_noti.show(option, type);
                return false;
            }
            time =  typeof time === 'undefined' ? 300000 : time;
            k_noti.hide();
            k_noti.show(option, type);
            clearTimeout(last_time_out_id);
            last_time_out_id = setTimeout(function() {
                k_noti.hide();
            }, time);
            return false;
        }
    })
})(jQuery);