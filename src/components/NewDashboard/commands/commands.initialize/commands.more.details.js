import lang from "../commands.constants";
import CommandsConnector from "../commands.connector";

class CommandsMoreDetails {
    constructor(signatureOptions){
      this.status = signatureOptions;
      this.isDisabled = this.enabled();
      this.defaults = {
          value: lang.MORE_DETAILS.moreDetails,
          disabled: this.isDisabled,
          onClick: () => this.execute()
      };
      this.customHtmlContentFileName = this.status.params.accIdAndName[1] + '-' + this.status.roomConstantKey + '.html';
    };

    enabled(){
        return !lang.isCommandsEnabled.moreDetails.includes(this.status.roomConstantKey);
    };

    execute(){
      // Selected node id will be passed here, we have to fetch the data for the selected node id.
      this.fetchCustomHtmlContent().then((result) => {
          this._prepareDashboardControllerOptions(result);
          this.status.eventHelpers.dashboardController(this.dashboardController);
      });
    };

    // Fetch dynamic html content based on the signatureOption's roomConstantKey.
    // This method will fetch dynamic html content from the server based on the table mode we are currently in.
    // So that this command can be used by multiple table room constants.
    // TODO: If the preview template is not found in the server, rollback to the custom template (Show More details in custom modals).
    fetchCustomHtmlContent(){
        var options = {
            accId: this.status.params.accIdAndName[0],
            filename: this.customHtmlContentFileName
        }
        return CommandsConnector._getCustomHTMLContent(options).then((result) => {
            return result;
        }).catch(() => {
            console.warn('Error occurred while fetching the dynamic html content');
        })
    };

    // Prepare dashboard controller options.
    _prepareDashboardControllerOptions(htmlContent){
      this.dashboardController = {
          goToCustomHtmlContent: true,
          dashboardMode: lang.MORE_DETAILS.dashboardMode,
          customHtmlContent: {
              content: htmlContent
          },
          replacements: {}
      }
    };
};

export default CommandsMoreDetails;