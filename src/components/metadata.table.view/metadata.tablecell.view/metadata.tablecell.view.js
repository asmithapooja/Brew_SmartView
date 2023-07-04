import React from 'react';
import MetadataFields from '../../fields/metadata.fields.view';

const MetadataTableCellView = (props) => {

  // Render checkbox view!
  function _renderCheckBoxView(options) {
    return <MetadataFields data={props.checkbox} checkboxIndex={options[0]} />
  }

  // Render table cell view!
  function _renderTableCellView() {
    return (
      props.data.map((options, key) => {
        return (
          <tr key={key}>
            {props.enableCheckbox && (
              props.checkbox.map((field, index) => {
                return (
                  field.enableCellCheckbox && (
                    <td className="metadata-table-checkbox" key={index}>
                      {_renderCheckBoxView(options)}
                    </td>
                  )
                )
              })
            )}
            {options.map((opts, modelId) => {
              if(modelId !== 0){
                return (
                  <td className="metadata-tablecell-view" key={modelId}>
                    {opts}
                  </td>
                )
              }
            })}
          </tr>
        )
      })
    )
  }

  return (
    _renderTableCellView()
  )
}

export default MetadataTableCellView;