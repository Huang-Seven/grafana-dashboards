import React, {
  useCallback, useContext, useEffect, useState
} from 'react';
import {
  Divider, Icon, Select, Tooltip
} from 'antd';
import { cx } from 'emotion';
import { sortBy } from 'lodash';
import { QueryAnalyticsProvider } from 'pmm-qan/panel/provider/provider';
import { METRIC_CATALOGUE } from 'pmm-qan/panel/QueryAnalytics.constants';
import { OptionContent } from './OptionContent/OptionContent';
import { styles } from './ManageColumns.styles';
import './ManageColumns.scss';

const { Option } = Select;

const getMetricsAvailability = (tags, availableMetrics) => {
  if (!availableMetrics) {
    return true;
  }

  if (tags.includes('all')) {
    return true;
  }

  if (availableMetrics.filter((value) => tags.includes(value)).length) {
    return true;
  }

  return false;
};

export const ManageColumns = (props) => {
  const {
    onlyAdd, currentMetric, placeholder, width, mainMetric
  } = props;
  const {
    contextActions,
    panelState: { columns, availableMetrics },
  } = useContext(QueryAnalyticsProvider);
  const [availableColumns, setAvailableColumns] = useState<any[]>(Object.values(METRIC_CATALOGUE));
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const extraSelectProps = {
    dropdownAlign: { overflow: { adjustX: true } },
    getPopupContainer: (trigger) => trigger.parentNode,
  };

  useEffect(() => {
    const filterByExistent = (metric) => !columns.find((item) => item === metric.simpleName);
    const filterByAvailable = (item) => getMetricsAvailability(item.serviceTypes, availableMetrics);
    const filterByNotAvailable = (item) => !getMetricsAvailability(item.serviceTypes, availableMetrics);
    const availableMetrics = Object.values(METRIC_CATALOGUE).filter(filterByExistent);
    const metricsList = sortBy(availableMetrics, [(metric) => metric.humanizeName.toLowerCase()], ['desc']);

    setAvailableColumns([
      ...metricsList.filter(filterByAvailable).map((item) => ({ ...item, isMetricAvailable: true })),
      ...metricsList.filter(filterByNotAvailable),
    ]);
  }, [columns, availableMetrics]);

  const changeColumn = useCallback(
    (column) => {
      if (onlyAdd) {
        contextActions.addColumn(column);
      } else {
        contextActions.changeColumn({
          column,
          oldColumn: currentMetric,
        });
      }
    },
    [currentMetric, onlyAdd]
  );

  const removeColumn = useCallback(() => contextActions.removeColumn(currentMetric), [currentMetric]);
  const swapWithMain = useCallback(() => contextActions.swapMainColumn(currentMetric), [currentMetric]);

  const Placeholder = () => (!onlyAdd ? (
    <Tooltip
      title={() => (
        <div className={styles.metricsTooltip}>
          <b className={styles.placeholder}>{placeholder && METRIC_CATALOGUE[placeholder].humanizeName}</b>
          <span className={styles.placeholder}>
            {placeholder && METRIC_CATALOGUE[placeholder].tooltipText}
          </span>
        </div>
      )}
      placement="topLeft"
    >
      <div>
        <span className={cx(styles.placeholder, styles.placeholderPadding)}>
          {placeholder && METRIC_CATALOGUE[placeholder].humanizeName}
        </span>
      </div>
    </Tooltip>
  ) : (
    <div className={styles.placeholderAdd}>
      {!isDropdownOpen && (
      <div>
        <i className={cx('fa fa-plus-circle', styles.iconMargin)} />
        <span>Add column</span>
      </div>
      )}
    </div>
  ));

  const dropdownRender = (menu) => (
    <div className="add-column-wrapper">
      {menu}
      {!onlyAdd ? <Divider className={styles.dividerMargin} /> : null}
      {!onlyAdd && columns.length > 1 ? (
        <div className={styles.actionElement} onMouseDown={(e) => e.preventDefault()} onClick={removeColumn}>
          <Icon type="minus" className={styles.iconMargin} />
          Remove column
        </div>
      ) : null}
      {!onlyAdd && mainMetric !== currentMetric.simpleName ? (
        <div className={styles.actionElement} onMouseDown={(e) => e.preventDefault()} onClick={swapWithMain}>
          <Icon type="swap" className={styles.iconMargin} />
          Swap with main metric
        </div>
      ) : null}
    </div>
  );

  return (
    <div className={!onlyAdd ? 'manage-columns' : 'add-columns'} onClick={(e) => e.stopPropagation()}>
      <Select
        optionLabelProp="label"
        showSearch
        style={{ width: width || '125px' }}
        placeholder={<Placeholder />}
        filterOption={(value, option) => String(option.props.label)
          .toLowerCase()
          .includes(value.toLowerCase())}
        onChange={changeColumn}
        onDropdownVisibleChange={(open) => setDropdownOpen(open)}
        dropdownMatchSelectWidth={false}
        value={undefined}
        showArrow={false}
        className={`${onlyAdd ? 'add' : 'manage'}-columns-selector`}
        dropdownClassName={`${onlyAdd ? 'add' : 'manage'}-columns-selector-dropdown`}
        dropdownRender={dropdownRender}
        data-qa="manage-columns-selector"
        {...extraSelectProps}
      >
        {availableColumns.map((item) => (
          <Option key={item.simpleName} label={item.humanizeName}>
            <OptionContent
              title={item.humanizeName}
              description={item.tooltipText}
              tags={item.serviceTypes}
              disabled={item.isMetricAvailable}
            />
          </Option>
        ))}
      </Select>
    </div>
  );
};
