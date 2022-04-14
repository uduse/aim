import { Link as RouteLink } from 'react-router-dom';
import _ from 'lodash-es';

import { Link, Tooltip } from '@material-ui/core';

import { Badge, Button, Icon, JsonViewPopover } from 'components/kit';
import TableSortIcons from 'components/Table/TableSortIcons';
import ControlPopover from 'components/ControlPopover/ControlPopover';
import ErrorBoundary from 'components/ErrorBoundary/ErrorBoundary';

import COLORS from 'config/colors/colors';
import { PathEnum } from 'config/enums/routesEnum';

import { ITableColumn } from 'types/pages/metrics/components/TableColumns/TableColumns';
import { IOnGroupingSelectChangeParams } from 'types/services/models/metrics/metricsAppModel';
import { IGroupingSelectOption } from 'types/services/models/imagesExplore/imagesExploreAppModel';

import alphabeticalSortComparator from 'utils/alphabeticalSortComparator';
import { isSystemMetric } from 'utils/isSystemMetric';
import { formatSystemMetricName } from 'utils/formatSystemMetricName';
import contextToString from 'utils/contextToString';
import { formatValue } from 'utils/formatValue';
import { SortActionTypes, SortField } from 'utils/getSortedFields';

const icons: { [key: string]: string } = {
  color: 'coloring',
  stroke: 'line-style',
  chart: 'chart-group',
};

function getParamsTableColumns(
  groupingSelectOptions: IGroupingSelectOption[],
  metricsColumns: any,
  paramColumns: string[] = [],
  groupFields: { [key: string]: string } | null,
  order: { left: string[]; middle: string[]; right: string[] },
  hiddenColumns: string[],
  sortFields?: any[],
  onSort?: ({ sortFields, order, index, actionType }: any) => void,
  grouping?: { [key: string]: string[] },
  onGroupingToggle?: (params: IOnGroupingSelectChangeParams) => void,
): ITableColumn[] {
  let columns: ITableColumn[] = [
    {
      key: 'experiment',
      content: <span>Experiment</span>,
      topHeader: 'Run',
      pin: order?.left?.includes('experiment')
        ? 'left'
        : order?.middle?.includes('experiment')
        ? null
        : order?.right?.includes('experiment')
        ? 'right'
        : null,
      columnOptions: ['color', 'stroke', 'chart'].map((groupName: string) => ({
        value: `${
          grouping?.[groupName]?.includes('run.props.experiment') ? 'un' : ''
        }group by ${groupName}`,
        onClick: () => {
          if (onGroupingToggle) {
            onGroupingToggle({
              groupName,
              list: grouping?.[groupName]?.includes('run.props.experiment')
                ? grouping?.[groupName].filter(
                    (item) => item !== 'run.props.experiment',
                  )
                : grouping?.[groupName].concat(['run.props.experiment']),
            } as IOnGroupingSelectChangeParams);
          }
        },
        icon: icons[groupName],
      })),
    },
    {
      key: 'run',
      content: <span>Run Name</span>,
      topHeader: 'Run',
      pin: order?.left?.includes('run')
        ? 'left'
        : order?.middle?.includes('run')
        ? null
        : order?.right?.includes('run')
        ? 'right'
        : 'left',
      columnOptions: ['color', 'stroke', 'chart'].map((groupName: string) => ({
        value: `${
          grouping?.[groupName]?.includes('run.hash') ? 'un' : ''
        }group by ${groupName}`,
        onClick: () => {
          if (onGroupingToggle) {
            onGroupingToggle({
              groupName,
              list: grouping?.[groupName]?.includes('run.hash')
                ? grouping?.[groupName].filter((item) => item !== 'run.hash')
                : grouping?.[groupName].concat(['run.hash']),
            } as IOnGroupingSelectChangeParams);
          }
        },
        icon: icons[groupName],
      })),
    },
    {
      key: 'description',
      content: <span>Description</span>,
      topHeader: 'Run',
      pin: order?.left?.includes('description')
        ? 'left'
        : order?.middle?.includes('description')
        ? null
        : order?.right?.includes('description')
        ? 'right'
        : null,
      columnOptions: ['color', 'stroke', 'chart'].map((groupName: string) => ({
        value: `${
          grouping?.[groupName]?.includes('run.hash') ? 'un' : ''
        }group by ${groupName}`,
        onClick: () => {
          if (onGroupingToggle) {
            onGroupingToggle({
              groupName,
              list: grouping?.[groupName]?.includes('run.hash')
                ? grouping?.[groupName].filter((item) => item !== 'run.hash')
                : grouping?.[groupName].concat(['run.hash']),
            } as IOnGroupingSelectChangeParams);
          }
        },
        icon: icons[groupName],
      })),
    },
    {
      key: 'date',
      content: <span>Date</span>,
      topHeader: 'Run',
      pin: order?.left?.includes('date')
        ? 'left'
        : order?.middle?.includes('date')
        ? null
        : order?.right?.includes('date')
        ? 'right'
        : null,
      columnOptions: ['color', 'stroke', 'chart'].map((groupName: string) => ({
        value: `${
          grouping?.[groupName]?.includes('run.hash') ? 'un' : ''
        }group by ${groupName}`,
        onClick: () => {
          if (onGroupingToggle) {
            onGroupingToggle({
              groupName,
              list: grouping?.[groupName]?.includes('run.hash')
                ? grouping?.[groupName].filter((item) => item !== 'run.hash')
                : grouping?.[groupName].concat(['run.hash']),
            } as IOnGroupingSelectChangeParams);
          }
        },
        icon: icons[groupName],
      })),
    },
    {
      key: 'actions',
      content: '',
      topHeader: '',
      pin: 'right',
    },
  ].concat(
    Object.keys(metricsColumns).reduce((acc: any, key: string) => {
      const systemMetric: boolean = isSystemMetric(key);
      const systemMetricsList: ITableColumn[] = [];
      const metricsList: ITableColumn[] = [];
      Object.keys(metricsColumns[key]).forEach((metricContext) => {
        const columnKey = `${systemMetric ? key : `${key}_${metricContext}`}`;
        let column = {
          key: columnKey,
          content: systemMetric ? (
            <span>{formatSystemMetricName(key)}</span>
          ) : (
            <Badge
              monospace
              size='small'
              color={COLORS[0][0]}
              label={metricContext === '' ? 'Empty context' : metricContext}
            />
          ),
          topHeader: systemMetric ? 'System Metrics' : key,
          pin: order?.left?.includes(columnKey)
            ? 'left'
            : order?.right?.includes(columnKey)
            ? 'right'
            : null,
        };
        systemMetric
          ? systemMetricsList.push(column)
          : metricsList.push(column);
      });
      acc = [
        ...acc,
        ...metricsList.sort(alphabeticalSortComparator({ orderBy: 'key' })),
        ...systemMetricsList.sort(
          alphabeticalSortComparator({ orderBy: 'key' }),
        ),
      ];
      return acc;
    }, []),
    paramColumns.map((param) => {
      const paramKey = `run.params.${param}`;
      let index = -1;
      const sortItem: SortField | undefined = sortFields?.find((value, i) => {
        if (value.value === paramKey) {
          index = i;
        }
        return value.value === paramKey;
      });
      return {
        key: param,
        content: (
          <span>
            {param}
            {onSort && (
              <TableSortIcons
                onSort={() =>
                  onSort({
                    sortFields,
                    index,
                    field:
                      index === -1
                        ? groupingSelectOptions.find(
                            (value) => value.value === paramKey,
                          )
                        : sortItem,
                    actionType:
                      sortItem?.order === 'desc'
                        ? SortActionTypes.DELETE
                        : SortActionTypes.ORDER_TABLE_TRIGGER,
                  })
                }
                sort={!_.isNil(sortItem) ? sortItem.order : null}
              />
            )}
          </span>
        ),
        topHeader: 'Params',
        pin: order?.left?.includes(param)
          ? 'left'
          : order?.right?.includes(param)
          ? 'right'
          : null,
        columnOptions: ['color', 'stroke', 'chart'].map(
          (groupName: string) => ({
            value: `${
              grouping?.[groupName]?.includes(paramKey) ? 'un' : ''
            }group by ${groupName}`,
            onClick: () => {
              if (onGroupingToggle) {
                onGroupingToggle({
                  groupName,
                  list: grouping?.[groupName]?.includes(paramKey)
                    ? grouping?.[groupName].filter((item) => item !== paramKey)
                    : grouping?.[groupName].concat([paramKey]),
                } as IOnGroupingSelectChangeParams);
              }
            },
            icon: icons[groupName],
          }),
        ),
      };
    }),
  );

  columns = columns.map((col) => ({
    ...col,
    isHidden: hiddenColumns.includes(col.key),
  }));

  const columnsOrder = order?.left.concat(order.middle).concat(order.right);
  columns.sort((a, b) => {
    if (a.key === '#') {
      return -1;
    } else if (a.key === 'actions') {
      return 1;
    }
    if (!columnsOrder.includes(a.key) && !columnsOrder.includes(b.key)) {
      return 0;
    } else if (!columnsOrder.includes(a.key)) {
      return 1;
    } else if (!columnsOrder.includes(b.key)) {
      return -1;
    }
    return columnsOrder.indexOf(a.key) - columnsOrder.indexOf(b.key);
  });

  if (groupFields) {
    columns = [
      {
        key: '#',
        content: (
          <span
            style={{
              textAlign: 'right',
              display: 'inline-block',
              width: '100%',
            }}
          >
            #
          </span>
        ),
        topHeader: 'Grouping',
        pin: 'left',
      },
      {
        key: 'groups',
        content: (
          <div className='Table__groupsColumn__cell'>
            {Object.keys(groupFields).map((field) => {
              let name: string = field.replace('run.params.', '');
              name = name.replace('run.props', 'run');
              return (
                <Tooltip key={field} title={name || ''}>
                  <div>{name}</div>
                </Tooltip>
              );
            })}
          </div>
        ),
        pin: order?.left?.includes('groups')
          ? 'left'
          : order?.right?.includes('groups')
          ? 'right'
          : null,
        topHeader: 'Groups',
      },
      ...columns,
    ];
  }

  return columns;
}

function paramsTableRowRenderer(
  rowData: any,
  actions?: { [key: string]: (e: any) => void },
  groupHeaderRow = false,
  columns: string[] = [],
) {
  if (groupHeaderRow) {
    const row: { [key: string]: any } = {};
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      if (col === 'groups') {
        row.groups = {
          content: (
            <ErrorBoundary>
              <div className='Table__groupsColumn__cell'>
                {Object.keys(rowData[col]).map((item) => {
                  const value: string | { [key: string]: unknown } =
                    rowData[col][item];
                  return _.isObject(value) ? (
                    <ControlPopover
                      key={contextToString(value)}
                      title={item}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'left',
                      }}
                      anchor={({ onAnchorClick }) => (
                        <Tooltip
                          title={(contextToString(value) as string) || ''}
                        >
                          <span onClick={onAnchorClick}>
                            {contextToString(value)}
                          </span>
                        </Tooltip>
                      )}
                      component={<JsonViewPopover json={value} />}
                    />
                  ) : (
                    <Tooltip key={item} title={formatValue(value) || ''}>
                      <div>{formatValue(value)}</div>
                    </Tooltip>
                  );
                })}
              </div>
            </ErrorBoundary>
          ),
        };
      } else if (Array.isArray(rowData[col])) {
        row[col] = {
          content: (
            <ErrorBoundary>
              <Badge
                monospace
                size='small'
                color={COLORS[0][0]}
                label={`${rowData[col].length} values`}
              />
            </ErrorBoundary>
          ),
        };
      }
    }

    return _.merge({}, rowData, row);
  } else {
    const row = {
      experiment: rowData.experiment,
      run: {
        content: (
          <Link
            to={PathEnum.Run_Detail.replace(':runHash', rowData.runHash)}
            component={RouteLink}
          >
            {rowData.run}
          </Link>
        ),
      },
      actions: {
        content: (
          <Button
            withOnlyIcon={true}
            size='medium'
            onClick={actions?.toggleVisibility}
            className='Table__action__icon'
            aria-pressed='false'
          >
            <Icon
              name={rowData.isHidden ? 'eye-outline-hide' : 'eye-show-outline'}
            />
          </Button>
        ),
      },
    };

    return _.merge({}, rowData, row);
  }
}

export { getParamsTableColumns, paramsTableRowRenderer };
