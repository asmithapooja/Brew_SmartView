import React from 'react';
import _ from 'lodash';
import { templateHelpers } from './stepper.wizard.template';
import './stepper.wizard.view.css';

class StepperWizard extends React.Component {
  
  constructor(props){
    super(props);
    this.state = {
      data: props.data,
      bodyView: props.bodyView
    };
    this.footerViewRef = React.createRef()
  };
  
  // Template helpers!
  templateHelpers(){
    this.prepareTemplateHelperOptions();
    return templateHelpers(this.templateHelpersOptions);
  };
  
  // Prepare template helpers options!
  prepareTemplateHelperOptions(){
    this.templateHelpersOptions = {
      propsData: this.state.data,
      closeWizard: this.closeWizardOnClick.bind(this),
      callFooter: this.renderPassedFooter.bind(this),
      callBodyView: this.renderBodyView.bind(this),
      bodyViewHeight: window.innerHeight - (this.footerViewRef?.current?.offsetHeight + 40)
    };
  };
  
  // Onclick close stepper wizard!
  closeWizardOnClick(event){
    event.preventDefault();
    event.stopPropagation();
    this.state.data.onHide();
  };
  
  // Render passed body view!
  renderBodyView(){
    var passingProps = this.state.data.passingProps;
    return this.state.bodyView ? this.state.bodyView(this.state.data[passingProps]) : this.state.data.bodyView();
  };
  
  // Render passed footer view!
  renderPassedFooter(){
    this.state.data.enableFooter && !this.state.isFooterViewRendered && this.setState({isFooterViewRendered: true});
    if(this.state.data.enableFooter){
      return(
          <div ref = {this.footerViewRef}>
            {this.state.data.footerView()}
          </div>
      )
    }
  };
  
  // Update the state value if the parent props changes!
  _updateStateValue(updatedData){
    this.setState({data: updatedData});
  };
  
  componentDidUpdate(prevProps){
    if(!_.isEqual(this.state.data, this.props.data)){
      this._updateStateValue(this.props.data);
    };
  };
  
  render(){
    return this.templateHelpers();
  };
};

export default StepperWizard;
