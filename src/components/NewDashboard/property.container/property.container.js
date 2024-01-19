import React, {useState, useEffect} from 'react';
import MetadataFields from '../../fields/metadata.fields.view';
import TableViewTemplateHelpers from "./table.view/table.view.template";
import CheckInForm from './checkin.view/checkin.form.view';
import CheckOutView from './checkout.view/checkout.form.view';
import RoomStatusView from './room.status.view/room.status.view';
import DefaultView from './default.view/default.view';
import StatusTableView from './table.view/table.view';
import FilterTable from './filter.table.wrapper/filter.table.wrapper';
import LogTable from './log.table.wrapper/log.table.wrapper';
import PaymentTrackerWrapper from "./payment.tracker.view/payment.tracker.wrapper";
import propertyContainerConstants from './property.container.constants';
import { extractStateValue, renderCustomHTMLContent } from '../../common.functions/node.convertor';
import PropertyReadView from "./property.base.view/property.read.view/property.read.view";
import PropertyEditView from "./property.base.view/property.edit.view/property.edit.view";

const PropertyContainer = (props) => {
  // Panel fields state handler!
  const [panelField, setPanelField] = useState([]);

  // Table view template initializer.
  var TableViewTemplate = new TableViewTemplateHelpers(
      {options: {onBack: ()=> onBackClick(),
          selectedRoomConstant: propertyContainerConstants.WIDGET_CONSTANTS[props.data.dashboardMode]}});

  // On back click on table toolbar view for property container.
  function onBackClick(){
    props.routerController()._notifyStateRouter({routerOptions: {action: 'DELETE'}}).then((result) => {
      props.dashboardController(getRouterOptions(result));
    })
  };

  // Get the router options!
  function getRouterOptions(stateRouter){
    var extendedTableOptions = {reloadSidepanel: {silent: true}, navigateToStatusTableView: true, dashboardMode: stateRouter.dashboardModel[stateRouter.dashboardModel.length - 1],
      selectedRoomConstant: stateRouter.tableModel[stateRouter.tableModel.length - 1]};
    var options = {
      'default-view': {reloadSidepanel: {silent: true}, navigateToPropertyContainer: true},
      'property-container': {reloadSidepanel: {silent: true}, persistStatusView:true, updatedModel: props.data.roomModel},
      'table-view': extendedTableOptions,
      'filter-table-view': extendedTableOptions,
      'payment-tracker-table-view': extendedTableOptions,
      'log-table-view': extendedTableOptions
    };
    return options[stateRouter.stateModel[stateRouter.stateModel.length -  1]];
  };
  
  // Get panel field data!
  function getPanelFieldData(){
    // Get panel field dropdown options!
    var panelFieldDropdownOptions = getPanelFieldDropdown();
    // Get panel field selected and default values!
    var selectedValues = getPanelFieldsValues();
    return [
      {
        value: selectedValues,
        actualValue: undefined,
        attribute: "dataListField",
        name: 'panelFieldDropdown',
        allowInputField: false,
        allowPanelField: propertyContainerConstants.ALLOW_PANEL_FIELD.includes(props.data.dashboardMode),
        allowRightSideControl: true,
        customPanelField: !propertyContainerConstants.ALLOW_PANEL_FIELD.includes(props.data.dashboardMode),
        renderCustomPanelField: () => TableViewTemplate.renderLeftSideController(),
        rightSideControl: _renderRightSideControl,
        height: 27,
        width: '200px',
        selectedValue: selectedValues,
        showListValue: function(){
          return props.data.dashboardMode !== propertyContainerConstants.DASHBOARD_MODE.roomStatus;
        },
        style: {
          width: "200",
          color: "black",
          fontSize: "15px",
          paddingRight: "10px",
          paddingLeft: "10px",
          cursor: "pointer",
        },
        options: panelFieldDropdownOptions
      }
    ]
  };

  // Should show panel dropdown for panel field.
  function shouldShowPanelDropdown(){
    return !propertyContainerConstants.IGNORE_PANEL_FIELD_DROPDOWN.includes(props.data.dashboardMode);
  };

  // Get panel field dropdown values!
  function getPanelFieldDropdown(){
    if(shouldShowPanelDropdown()){
       return [
          {
            value: (props.data.dashboardMode === propertyContainerConstants.DASHBOARD_MODE.edit ? propertyContainerConstants.FORM_MODE.checkinForm : propertyContainerConstants.FORM_MODE.checkoutForm),
          },
          {
            value: (props.data.dashboardMode === propertyContainerConstants.DASHBOARD_MODE.edit ? undefined : 'payment tracker'),
            actualValue: (props.data.dashboardMode === propertyContainerConstants.DASHBOARD_MODE.edit ? undefined : propertyContainerConstants.DASHBOARD_MODE.paymentTrackerView)
          },
          {
            value: (props.data.dashboardMode === propertyContainerConstants.DASHBOARD_MODE.edit ? undefined : 'Maintainance Log'),
            actualValue: (props.data.dashboardMode === propertyContainerConstants.DASHBOARD_MODE.edit ? undefined : propertyContainerConstants.DASHBOARD_MODE.logTableView)
          }
        ]
    } else {
      return []; // Return empty array as per the design of the panel field!
    }
  };
  
  // Update panel field data from the metadata fields!
  function _updatePanelFieldData(updatedData){
    setPanelField(updatedData);
    var panelFieldOptions = extractStateValue(updatedData, 'actualValue');
    // Options to handle perspective change!
    var options = {
      navigateToStatusTableView: true,
      selectedRoomConstant: propertyContainerConstants.TABLE_HEADERS[panelFieldOptions.panelFieldDropdown], // Here, selectedRoomConstant represents table header for the table view.
      // In case of room transfer view, the table header value is being overriden in the filter.table.wrapper
      dashboardMode: panelFieldOptions.panelFieldDropdown,
      routerOptions: {currentRouter: propertyContainerConstants.propertyContainerPerspectiveConstant, action: 'ADD'}
    };
    props.dashboardController(options);
  };

  // Get panel field dropdown selectedValues and values!
  function getPanelFieldsValues(){
    if(props.data.dashboardMode !== propertyContainerConstants.DASHBOARD_MODE.roomStatus){
      return (props.data.dashboardMode === propertyContainerConstants.DASHBOARD_MODE.edit ? propertyContainerConstants.FORM_MODE.checkinForm : propertyContainerConstants.FORM_MODE.checkoutForm);
    }
  };

  // Render property model!
  function _renderPropertyModel(){
    if(props.data.dashboardMode === propertyContainerConstants.DASHBOARD_MODE.edit){
      return <CheckInForm height = {props.propertyContainerHeight} data = {props.data} params = {props.params} routerController = {(opts) => props.routerController(opts)}
      afterFormSave = {(opts) => props.onCancel(opts)} routerOptions = {(opts) => getRouterOptions(opts)} dashboardController = {(opts) => props.dashboardController(opts)} />
    };
    
    if(props.data.dashboardMode === propertyContainerConstants.DASHBOARD_MODE.read){
      return <CheckOutView height = {props.propertyContainerHeight} data = {props.data} params = {props.params} dashboardController = {(opts) => props.dashboardController(opts)}
      updateSelectedModel = {(roomModel, dashboardMode, userModel) => props.updateSelectedModel(roomModel, dashboardMode, userModel)} routerOptions = {(opts) => getRouterOptions(opts)}
      cancelCheckoutPrompt = {(opts) => props.cancelCheckoutPrompt(opts)} routerController = {(opts) => props.routerController(opts)} />
    };
    
    if(props.data.dashboardMode === propertyContainerConstants.DASHBOARD_MODE.roomStatus){
      return <RoomStatusView height = {props.propertyContainerHeight} data = {props.data} params = {props.params}
      dashboardController = {(opts) => props.dashboardController(opts)} routerController = {(opts) => props.routerController(opts)} />
    };
    
    if(props.data.dashboardMode === propertyContainerConstants.DASHBOARD_MODE.default){
      return <DefaultView data = {props.propertyDetails} params = {props.params} height = {props.propertyContainerHeight}
      dashboardController = {(opts) => props.dashboardController(opts)} routerController = {(opts) => props.routerController(opts)} />
    };
    
    if(props.data.dashboardMode === propertyContainerConstants.DASHBOARD_MODE.statusTableView){
      return <StatusTableView data = {props.data}  params = {props.params} propertyDetails = {props.propertyDetails} height = {props.propertyContainerHeight} getRouterOptions = {(stateModel) => getRouterOptions(stateModel)}
      dashboardController = {(opts) => props.dashboardController(opts)} stateRouter = {props.stateRouter} routerController = {(opts) => props.routerController(opts)}
      updateSelectedModel = {(roomModel, dashboardMode, userModel) => props.updateSelectedModel(roomModel, dashboardMode, userModel)}/>
    };
    
    if(props.data.dashboardMode === propertyContainerConstants.DASHBOARD_MODE.filterTableView){
      return <FilterTable data = {props.data} propertyDetails = {props.propertyDetails} height = {props.propertyContainerHeight} stateRouter = {props.stateRouter} getRouterOptions = {(stateModel) => getRouterOptions(stateModel)}
      dashboardController = {(opts) => props.dashboardController(opts)} params = {props.params} routerController = {(opts) => props.routerController(opts)} />
    };
    
    if(props.data.dashboardMode === propertyContainerConstants.DASHBOARD_MODE.logTableView){
      return <LogTable data = {props.data} propertyDetails = {props.propertyDetails} height = {props.propertyContainerHeight} getRouterOptions = {(stateModel) => getRouterOptions(stateModel)}
      routerController = {(opts) => props.routerController(opts)} stateRouter = {props.stateRouter} dashboardController = {(opts) => props.dashboardController(opts)} params = {props.params} />
    };

    if(props.data.dashboardMode === propertyContainerConstants.DASHBOARD_MODE.paymentTrackerView){
      return <PaymentTrackerWrapper data = {props.data} propertyDetails = {props.propertyDetails} height = {props.propertyContainerHeight} getRouterOptions = {(stateModel) => getRouterOptions(stateModel)}
      routerController = {(opts) => props.routerController(opts)} stateRouter = {props.stateRouter} dashboardController = {(opts) => props.dashboardController(opts)} params = {props.params} />
    };

    if(props.data.dashboardMode === propertyContainerConstants.DASHBOARD_MODE.propertyReadView){
      return <PropertyReadView data = {props.data} height = {props.propertyContainerHeight} routerController = {(opts) => props.routerController(opts)} params = {props.params} />
    };

    if(props.data.dashboardMode === propertyContainerConstants.DASHBOARD_MODE.propertyEditView){
      return <PropertyEditView />
    }

    if(props.data.dashboardMode === propertyContainerConstants.DASHBOARD_MODE.customHTMLView){
      return renderCustomHTMLContent(props.htmlContent.customHtmlContent, props.htmlContent.replacements, props.propertyContainerHeight);
    };
  };

  // Get form models!
  function getFormModels(){
    var emptyFormModel = [];

    var checkinFormModel = [{
        btnValue: propertyContainerConstants.BUTTON_FIELDS.cancelButton,
        onClick: onCancel,
        attribute: 'buttonField'
      },{
        btnValue: propertyContainerConstants.BUTTON_FIELDS.checkinButton,
        onClick: onCheckIn,
        attribute: 'buttonField'
      }
    ];
    
    var checkoutFormModel = [{
        btnValue: propertyContainerConstants.BUTTON_FIELDS.cancelButton,
        onClick: onCancel,
        attribute: 'buttonField'
      },
      {
        btnValue: propertyContainerConstants.BUTTON_FIELDS.checkoutButton,
        onClick: onCheckout,
        attribute: 'buttonField'
      }
    ];

    var roomStatusFormModel = [{
        btnValue: propertyContainerConstants.BUTTON_FIELDS.cancelButton,
        onClick: onCancel,
        attribute: 'buttonField'
    }];

    var propertyReadViewModel = [{
      btnValue: propertyContainerConstants.BUTTON_FIELDS.editButton,
      onClick: switchToPropertyEditMode,
      attribute: 'buttonField'
    }]
    
    return {checkinFormModel, checkoutFormModel, roomStatusFormModel, emptyFormModel, propertyReadViewModel};
  };

  // Get panel field right side data!
  function getPanelRightSideData(){
    var formModels = getFormModels();
    if(props.data.dashboardMode === propertyContainerConstants.DASHBOARD_MODE.edit){
      return formModels.checkinFormModel;
    };
    if(props.data.dashboardMode === propertyContainerConstants.DASHBOARD_MODE.read){
      return formModels.checkoutFormModel;
    }
    if(props.data.dashboardMode === propertyContainerConstants.DASHBOARD_MODE.roomStatus){
      return formModels.roomStatusFormModel;
    }
    if(props.data.dashboardMode === propertyContainerConstants.DASHBOARD_MODE.default){
      return formModels.checkinFormModel;
    }
    if(props.data.dashboardMode === propertyContainerConstants.DASHBOARD_MODE.propertyReadView){
      return formModels.propertyReadViewModel;
    }
    if(props.data.dashboardMode === propertyContainerConstants.DASHBOARD_MODE.statusTableView || props.data.dashboardMode === propertyContainerConstants.DASHBOARD_MODE.filterTableView){
      return formModels.emptyFormModel;
    }
  };
  
  // Render right side control panel for datalist field!
  function _renderRightSideControl(){
    var panelRightSideData = getPanelRightSideData();
    return <MetadataFields data = {panelRightSideData} />
  };

  // On checkout!
  function onCheckout(){
    props.onCheckout(true);
  };
  
  // On Cancel!
  function onCancel(){
    return onBackClick();
  };

  // Switch to property edit mode,
  function switchToPropertyEditMode(){
    var options = {
      roomModel: props.data.roomModel,
      goToLocation: true,
      dashboardMode: propertyContainerConstants.DASHBOARD_MODE.propertyEditView
    }
    props.dashboardController(options);
  };
  
  // On Save!
  function onCheckIn(){
    props.onSave(true); // this will trigger the onSave API call in checkin form view!
  };
  
  // Should show panel field and for statusTableView we render panel field separately!
  function shouldShowPanelField(){
    return !propertyContainerConstants.IGNORE_PANEL_FIELD.includes(props.data.dashboardMode);
  };
  
  // Force update when the props change!
  useEffect(() => {
    var panelFieldData = getPanelFieldData();
    setPanelField(panelFieldData); // Update the panel field data when the dashboardMode changes!
  }, [props.data.dashboardMode])
  
  return(
    <>
      {shouldShowPanelField() && (
        <MetadataFields data = {panelField} updateData = {(updatedData) => _updatePanelFieldData(updatedData)} />
      )}
      {_renderPropertyModel()}
    </>
  )
}

export default PropertyContainer;