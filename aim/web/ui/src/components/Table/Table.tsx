// @ts-nocheck
/* eslint-disable react/prop-types */

import React from 'react';
import { debounce, isEmpty, isNil } from 'lodash-es';

import { Button, Icon, Text } from 'components/kit';
import ControlPopover from 'components/ControlPopover/ControlPopover';
import IllustrationBlock from 'components/IllustrationBlock/IllustrationBlock';
import BusyLoaderWrapper from 'components/BusyLoaderWrapper/BusyLoaderWrapper';
import ResizeModeActions from 'components/ResizeModeActions/ResizeModeActions';
import ErrorBoundary from 'components/ErrorBoundary/ErrorBoundary';

import {
  ROW_CELL_SIZE_CONFIG,
  RowHeightSize,
  TABLE_DEFAULT_CONFIG,
} from 'config/table/tableConfigs';
import { IllustrationsEnum } from 'config/illustrationConfig/illustrationConfig';

import useResizeObserver from 'hooks/window/useResizeObserver';

import SortPopover from 'pages/Metrics/components/Table/SortPopover/SortPopover';
import ManageColumnsPopover from 'pages/Metrics/components/Table/ManageColumnsPopover/ManageColumnsPopover';
import HideRowsPopover from 'pages/Metrics/components/Table/HideRowsPopover/HideRowsPopover';
import RowHeightPopover from 'pages/Metrics/components/Table/RowHeightPopover/RowHeightPopover';

import { ITableProps } from 'types/components/Table/Table';

import TableLoader from '../TableLoader/TableLoader';
import CustomTable from '../CustomTable/Table';

import ArchiveModal from './ArchiveModal';
import DeleteModal from './DeleteModal';
import AutoResizer from './AutoResizer';
import BaseTable from './BaseTable';

import './Table.scss';

const Table = React.forwardRef(function Table(
  {
    onManageColumns,
    onColumnsVisibilityChange,
    onTableDiffShow,
    onSort,
    onRowsChange,
    onExport,
    onRowHeightChange,
    onRowHover = () => {},
    onRowClick = () => {},
    onTableResizeModeChange,
    custom,
    data,
    columns,
    navBarItems,
    rowHeight = RowHeightSize.md,
    estimatedRowHeight,
    headerHeight = RowHeightSize.md,
    sortOptions,
    hideHeaderActions = false,
    fixed = true,
    excludedFields,
    setExcludedFields,
    alwaysVisibleColumns,
    rowHeightMode,
    hiddenColumns,
    updateColumns,
    columnsWidths,
    updateColumnsWidths,
    sortFields,
    hiddenRows,
    isLoading,
    showRowClickBehaviour = true,
    showResizeContainerActionBar = true,
    resizeMode,
    onSortReset,
    height = 'calc(100% - 40px)',
    multiSelect = false,
    selectedRows,
    onRowSelect,
    minHeight,
    archiveRuns,
    deleteRuns,
    hideSystemMetrics,
    className = '',
    appName,
    hiddenChartRows,
    focusedState,
    columnsOrder,
    illustrationConfig,
    disableRowClick = false,
    onToggleColumnsColorScales,
    columnsColorScales,
    ...props
  }: ITableProps,
  ref,
): React.FunctionComponentElement<React.ReactNode> {
  const tableRef = React.useRef();
  const startIndex = React.useRef(0);
  const endIndex = React.useRef(0);
  const expandedGroups = React.useRef([]);
  const hoveredRowKey = React.useRef(null);
  const activeRowKey = React.useRef(null);
  const tableContainerRef = React.useRef();
  const dataRef = React.useRef(data);
  const columnsRef = React.useRef(columns ?? []);
  const hiddenColumnsRef = React.useRef(hiddenColumns);
  const scrollTopMutableRef = React.useRef({ top: 0 });

  const [rowData, setRowData] = React.useState(data);
  const [columnsData, setColumnsData] = React.useState(columns ?? []);
  const [expanded, setExpanded] = React.useState({});
  const [isOpenDeleteSelectedPopup, setIsOpenDeleteSelectedPopup] =
    React.useState(false);
  const [isOpenUnarchiveSelectedPopup, setIsOpenUnarchiveSelectedPopup] =
    React.useState(false);
  const [isOpenArchiveSelectedPopup, setIsOpenArchiveSelectedPopup] =
    React.useState(false);
  const [tableBulkActionsVisibility, setTableBulkActionsVisibility] =
    React.useState({ delete: false, archive: false, unarchive: false });
  const [listWindow, setListWindow] = React.useState({
    left: 0,
    width: 0,
  });

  let groups = !Array.isArray(rowData);

  React.useEffect(() => {
    if (focusedState && !focusedState.active) {
      activeRowKey.current = null;
    }
  }, [focusedState]);

  React.useEffect(() => {
    updateFocusedRow(`rowKey-${activeRowKey.current}`);
  }, [selectedRows]);

  React.useImperativeHandle(ref, () => ({
    updateData: updateData,
    setHoveredRow: setHoveredRow,
    setActiveRow: setActiveRow,
    scrollToRow: scrollToRow,
  }));

  function calculateWindow({
    scrollTop,
    offsetHeight,
    itemHeight,
    groupMargin,
  }) {
    const offset = 10;

    if (groups) {
      let beforeScrollHeight = 0;
      let scrollBottomHeight = 0;
      let start = 0;
      let end = 0;
      let startIsSet = false;
      let endIsSet = false;
      for (let groupKey in dataRef.current) {
        beforeScrollHeight += itemHeight + groupMargin;
        scrollBottomHeight += itemHeight + groupMargin;
        if (expandedGroups.current.includes(groupKey)) {
          // eslint-disable-next-line no-loop-func
          dataRef.current[groupKey].items.forEach((row) => {
            if (scrollTop > beforeScrollHeight) {
              beforeScrollHeight += itemHeight;
            } else if (!startIsSet) {
              start = row.index;
              startIsSet = true;
            }

            if (scrollBottomHeight < scrollTop + offsetHeight) {
              scrollBottomHeight += itemHeight;
            } else if (!endIsSet) {
              end = row.index;
              endIsSet = true;
            }
          });
        } else {
          if (!endIsSet && !!dataRef.current[groupKey]?.items[0]?.index) {
            end = dataRef.current[groupKey]?.items[0]?.index;
          }
        }
      }

      const startIndex = start < offset ? 0 : start - offset;
      const endIndex = end + offset;

      return {
        startIndex,
        endIndex,
      };
    }

    const windowSize = Math.ceil(offsetHeight / itemHeight);
    const start = Math.floor(scrollTop / itemHeight);
    const startIndex = start < offset ? 0 : start - offset;
    const endIndex = start + windowSize + offset;

    return {
      startIndex,
      endIndex,
    };
  }

  function updateData({ newData, newColumns, hiddenColumns, dynamicData }) {
    if (custom && dynamicData) {
      if (!!newData) {
        dataRef.current = newData;
      }
      if (!!hiddenColumns) {
        hiddenColumnsRef.current = hiddenColumns;
      }
      if (!!newColumns) {
        columnsRef.current = newColumns;
        setColumnsData(newColumns);
      }
      virtualizedUpdate();
    } else {
      if (!!newData) {
        dataRef.current = newData;
        setRowData(newData);
      }
      if (!!hiddenColumns) {
        hiddenColumnsRef.current = hiddenColumns;
      }
      if (!!newColumns) {
        columnsRef.current = newColumns;
        setColumnsData(newColumns);
      }
    }
  }

  function setHoveredRow(rowKey: string) {
    window.requestAnimationFrame(() => {
      if (custom) {
        if (hoveredRowKey.current === rowKey) {
          hoveredRowKey.current = null;
        } else {
          hoveredRowKey.current = rowKey;
        }
        if (activeRowKey.current === null) {
          updateHoveredRow(`rowKey-${hoveredRowKey.current}`);
        }
      } else {
        tableRef.current?.setHoveredRow(rowKey);
      }
    });
  }

  function setActiveRow(rowKey: string, toggle = false) {
    window.requestAnimationFrame(() => {
      if (custom) {
        if (toggle && activeRowKey.current === rowKey) {
          activeRowKey.current = null;
        } else {
          activeRowKey.current = rowKey;
        }
        updateFocusedRow(`rowKey-${activeRowKey.current}`);
      } else {
        tableRef.current?.setActiveRow(rowKey);
      }
    });
  }

  function scrollToRow(rowKey: string) {
    window.requestAnimationFrame(() => {
      if (custom) {
        function scrollToElement() {
          const rowCell = document.querySelector(
            `.Table__cell.rowKey-${rowKey}`,
          );
          if (!!rowCell) {
            let top = 0;
            if (groups) {
              rowCell.parentElement?.childNodes?.forEach((item, index) => {
                if ([...item.classList].includes(`rowKey-${rowKey}`)) {
                  top =
                    rowCell.parentElement?.offsetTop + rowHeight * (index - 3);
                }
              });
            } else {
              top = rowCell.offsetTop - 2 * rowHeight;
            }
            if (
              tableContainerRef.current.scrollTop > top ||
              tableContainerRef.current.scrollTop +
                tableContainerRef.current.offsetHeight <
                top
            ) {
              tableContainerRef.current.scrollTo({
                top,
              });
            }
          }
        }

        if (groups) {
          for (let groupKey in dataRef?.current) {
            if (
              dataRef?.current[groupKey].data?.groupRowsKeys?.includes(rowKey)
            ) {
              if (expandedGroups.current.includes(groupKey)) {
                scrollToElement();
              } else {
                expandedGroups.current.push(groupKey);
                setExpanded(
                  Object.fromEntries(
                    expandedGroups.current.map((key) => [key, true]),
                  ),
                );
                // TODO: probably need useEffect for this
                setTimeout(() => {
                  window.requestAnimationFrame(() => {
                    updateFocusedRow(`rowKey-${rowKey}`);
                    scrollToElement();
                  });
                }, 100);
              }
            }
          }
        } else {
          scrollToElement();
        }
      } else {
        tableRef.current?.scrollToRowByKey(rowKey);
      }
    });
  }

  function virtualizedUpdate() {
    if (groups) {
      window.requestAnimationFrame(() => {
        ['value', 'step', 'epoch', 'time'].forEach((colKey) => {
          for (let groupKey in dataRef.current) {
            const groupHeaderRowCell = document.querySelector(
              `.Table__cell.${colKey}.index-${groupKey}`,
            );
            if (!!groupHeaderRowCell) {
              const groupRow = dataRef.current[groupKey];
              if (!!groupRow && !!groupRow.data) {
                if (colKey === 'value') {
                  groupHeaderRowCell.children[0].children[0].children[0].textContent =
                    groupRow.data.aggregation.area.min;
                  groupHeaderRowCell.children[0].children[0].children[1].textContent =
                    groupRow.data.aggregation.line;
                  groupHeaderRowCell.children[0].children[0].children[2].textContent =
                    groupRow.data.aggregation.area.max;
                } else {
                  groupHeaderRowCell.textContent = groupRow.data[colKey];
                }
                if (expandedGroups.current.includes(groupKey)) {
                  groupRow.items.forEach((row) => {
                    if (row.index > endIndex.current) {
                      return;
                    }
                    if (row.index >= startIndex.current) {
                      const cell = document.querySelector(
                        `.Table__cell.${colKey}.index-${row.index}`,
                      );
                      if (!!cell) {
                        cell.textContent = row[colKey];
                      }
                    }
                  });
                }
              }
            }
          }
        });
      });
    } else {
      window.requestAnimationFrame(() => {
        ['value', 'step', 'epoch', 'time'].forEach((colKey) => {
          for (let i = startIndex.current; i < endIndex.current; i++) {
            const cell = document.querySelector(
              `.Table__cell.${colKey}.index-${i}`,
            );
            if (!!cell) {
              const row = dataRef.current[i];
              if (!!row) {
                cell.textContent = row[colKey];
              }
            }
          }
        });
      });
    }
  }

  function onGroupExpandToggle(groupKey) {
    if (Array.isArray(groupKey)) {
      expandedGroups.current = groupKey;
    } else if (expandedGroups.current.includes(groupKey)) {
      expandedGroups.current = expandedGroups.current.filter(
        (item) => item !== groupKey,
      );
    } else {
      expandedGroups.current = expandedGroups.current.concat([groupKey]);
    }

    const windowEdges = calculateWindow({
      scrollTop: tableContainerRef.current.scrollTop,
      offsetHeight: tableContainerRef.current.offsetHeight,
      scrollHeight: tableContainerRef.current.scrollHeight,
      itemHeight: rowHeight,
      groupMargin: ROW_CELL_SIZE_CONFIG[rowHeight].groupMargin,
    });

    startIndex.current = windowEdges.startIndex;
    endIndex.current = windowEdges.endIndex;

    virtualizedUpdate();
  }

  function rowHoverHandler(row) {
    if (activeRowKey.current === null) {
      if (typeof onRowHover === 'function') {
        onRowHover(row.key);
      }
      updateHoveredRow(`rowKey-${row.key}`);
    }
  }

  function rowClickHandler(row) {
    if (showRowClickBehaviour) {
      if (activeRowKey.current === row.key) {
        activeRowKey.current = null;
      } else {
        activeRowKey.current = row.key;
      }

      updateFocusedRow(`rowKey-${activeRowKey.current}`);
    }

    if (typeof onRowClick === 'function') {
      onRowClick(
        activeRowKey.current === null ? undefined : activeRowKey.current,
      );
    }
  }

  function updateHoveredRow(activeRowClass) {
    const prevActiveRow = document.querySelectorAll('.Table__cell.focused');
    if (!!prevActiveRow && prevActiveRow.length > 0) {
      prevActiveRow.forEach((cell) => cell.classList.remove('focused'));
    }
    if (activeRowClass !== 'rowKey-null') {
      window.requestAnimationFrame(() => {
        const prevHoveredRow = document.querySelectorAll(
          '.Table__cell.hovered',
        );
        if (!!prevHoveredRow && prevHoveredRow.length > 0) {
          prevHoveredRow.forEach((cell) => cell.classList.remove('hovered'));
        }

        const activeRow = document.querySelectorAll(
          `.Table__cell.${activeRowClass}`,
        );

        if (!!activeRow && activeRow.length > 0) {
          activeRow.forEach((cell) => cell.classList.add('hovered'));
        }
      });
    }
  }

  function updateFocusedRow(activeRowClass) {
    const prevHoveredRow = document.querySelectorAll('.Table__cell.hovered');
    if (!!prevHoveredRow && prevHoveredRow.length > 0) {
      prevHoveredRow.forEach((cell) => cell.classList.remove('hovered'));
    }
    if (activeRowClass !== 'rowKey-null') {
      window.requestAnimationFrame(() => {
        const prevActiveRow = document.querySelectorAll('.Table__cell.focused');
        if (!!prevActiveRow && prevActiveRow.length > 0) {
          prevActiveRow.forEach((cell) => cell.classList.remove('focused'));
        }

        const activeRow = document.querySelectorAll(
          `.Table__cell.${activeRowClass}`,
        );

        if (!!activeRow && activeRow.length > 0) {
          activeRow.forEach((cell) => cell.classList.add('focused'));
        }
      });
    }
  }

  function setListWindowMeasurements() {
    setListWindow({
      left: tableContainerRef.current?.scrollLeft,
      width: tableContainerRef.current?.offsetWidth,
    });
  }

  function onToggleDeletePopup() {
    setIsOpenDeleteSelectedPopup(!isOpenDeleteSelectedPopup);
  }

  function onToggleArchivePopup() {
    setIsOpenArchiveSelectedPopup(!isOpenArchiveSelectedPopup);
  }

  function onToggleUnarchivePopup() {
    setIsOpenUnarchiveSelectedPopup(!isOpenUnarchiveSelectedPopup);
  }

  React.useEffect(() => {
    if (custom && !!tableContainerRef.current) {
      const windowEdges = calculateWindow({
        scrollTop: tableContainerRef.current.scrollTop,
        offsetHeight: tableContainerRef.current.offsetHeight,
        scrollHeight: tableContainerRef.current.scrollHeight,
        itemHeight: rowHeight,
        groupMargin: ROW_CELL_SIZE_CONFIG[rowHeight].groupMargin,
      });

      startIndex.current = windowEdges.startIndex;
      endIndex.current = windowEdges.endIndex;

      virtualizedUpdate();

      tableContainerRef.current.onscroll = debounce(({ target }) => {
        const windowEdges = calculateWindow({
          scrollTop: target.scrollTop,
          offsetHeight: target.offsetHeight,
          scrollHeight: target.scrollHeight,
          itemHeight: rowHeight,
          groupMargin: ROW_CELL_SIZE_CONFIG[rowHeight].groupMargin,
        });

        startIndex.current = windowEdges.startIndex;
        endIndex.current = windowEdges.endIndex;
        virtualizedUpdate();

        const isDownScrolling =
          scrollTopMutableRef.current.top < target.scrollTop;
        scrollTopMutableRef.current.top = target.scrollTop;

        if (
          props.allowInfiniteLoading &&
          props.infiniteLoadHandler &&
          isDownScrolling
        ) {
          if (
            target.scrollTop + target.offsetHeight >
            target.scrollHeight - 2 * rowHeight
          ) {
            props.infiniteLoadHandler();
          }
        }
        setListWindowMeasurements();
      }, 30);
    }

    return () => {
      if (custom && tableContainerRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        tableContainerRef.current.onscroll = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [custom, rowData]);

  React.useEffect(() => {
    if (custom) {
      setListWindowMeasurements();
    }
  }, [custom, columnsWidths, rowData]);

  React.useEffect(() => {
    if (custom) {
      requestAnimationFrame(() => {
        if (!activeRowKey.current) {
          updateHoveredRow(
            `rowKey-${
              activeRowKey.current
                ? activeRowKey.current
                : hoveredRowKey.current
            }`,
          );
        }
      });
    }
  }, [custom, listWindow]);

  const observerReturnCallback = React.useCallback(() => {
    setListWindowMeasurements();
  }, []);

  React.useEffect(() => {
    const tableBulkActionsVisibility = {
      delete: false,
      archive: false,
      unarchive: false,
    };
    const values = Object.values(selectedRows || {});
    for (let i = 0; i < values.length; i++) {
      const value: any = values[i];
      if (
        tableBulkActionsVisibility.delete &&
        tableBulkActionsVisibility.archive &&
        tableBulkActionsVisibility.unarchive
      ) {
        break;
      }
      if (value.archived) {
        tableBulkActionsVisibility.archive = true;
      } else {
        tableBulkActionsVisibility.unarchive = true;
      }
      if (value.end_time) {
        tableBulkActionsVisibility.delete = true;
      }
    }
    setTableBulkActionsVisibility(tableBulkActionsVisibility);
  }, [selectedRows]);

  const sortPopoverChanged: boolean = React.useMemo(() => {
    return (
      TABLE_DEFAULT_CONFIG[appName as Exclude<AppNameEnum, 'runs'>]?.sortFields
        ?.length !== sortFields?.length
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortFields]);

  useResizeObserver(
    observerReturnCallback,
    tableContainerRef,
    sortPopoverChanged,
  );

  // The right check is !props.isInfiniteLoading && (isLoading || isNil(rowData))
  // but after setting isInfiniteLoading to true, the rowData becomes null, unnecessary renders happening
  // @TODO sanitize this point
  return (
    <ErrorBoundary>
      <BusyLoaderWrapper
        isLoading={!props.isInfiniteLoading && (isLoading || isNil(rowData))}
        loaderComponent={<TableLoader />}
      >
        {!isEmpty(rowData) ? (
          <div style={{ height: '100%' }} className={className}>
            {!hideHeaderActions && isEmpty(selectedRows) ? (
              <div className='Table__header'>
                {showResizeContainerActionBar && (
                  <ResizeModeActions
                    resizeMode={resizeMode}
                    onTableResizeModeChange={onTableResizeModeChange}
                  />
                )}
                <div className='flex fac Table__header__buttons'>
                  {onManageColumns && (
                    <ManageColumnsPopover
                      columnsData={columnsData.filter(
                        (item: any) =>
                          item.key !== '#' && item.key !== 'actions',
                      )}
                      columnsOrder={columnsOrder}
                      hiddenColumns={hiddenColumns}
                      hideSystemMetrics={hideSystemMetrics}
                      onManageColumns={onManageColumns}
                      onColumnsVisibilityChange={onColumnsVisibilityChange}
                      onTableDiffShow={onTableDiffShow}
                      appName={appName}
                    />
                  )}
                  {onRowsChange && (
                    <HideRowsPopover
                      hiddenChartRows={hiddenChartRows}
                      toggleRowsVisibility={onRowsChange}
                    />
                  )}
                  {onSort && (
                    <ControlPopover
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'left',
                      }}
                      title='Sort table by:'
                      anchor={({ onAnchorClick, opened }) => (
                        <Button
                          type='text'
                          color='secondary'
                          onClick={onAnchorClick}
                          className={`Table__header__item ${
                            opened || sortPopoverChanged ? 'opened' : ''
                          }`}
                        >
                          <Icon name='sort-outside' />
                          <Text size={14} tint={100}>
                            Sort
                          </Text>
                        </Button>
                      )}
                      component={
                        <SortPopover
                          sortOptions={sortOptions}
                          sortFields={sortFields}
                          onSort={onSort}
                          onReset={onSortReset}
                        />
                      }
                    />
                  )}
                  {onRowHeightChange && (
                    <RowHeightPopover
                      rowHeight={rowHeight}
                      onRowHeightChange={onRowHeightChange}
                      appName={appName}
                    />
                  )}
                </div>
                {onExport && (
                  <div className='fac'>
                    <Button
                      fullWidth
                      variant='outlined'
                      color='primary'
                      size='small'
                      onClick={onExport}
                      startIcon={<Icon fontSize={14} name='download' />}
                    >
                      <Text size={14} color='inherit'>
                        Export
                      </Text>
                    </Button>
                  </div>
                )}
              </div>
            ) : !isEmpty(selectedRows) && multiSelect ? (
              <div className='Table__header selectedRowActionsContainer'>
                <div className='selectedRowActionsContainer__selectedRowsCount'>
                  <Text size={14} tint={50}>
                    {Object.keys(selectedRows).length} Selected
                  </Text>
                </div>
                {tableBulkActionsVisibility.delete && (
                  <div className='selectedRowActionsContainer__selectedItemsDelete'>
                    <Button
                      color='secondary'
                      type='text'
                      onClick={onToggleDeletePopup}
                      className={`Table__header__item ${
                        isOpenDeleteSelectedPopup ? 'opened' : ''
                      }`}
                    >
                      <Icon name='delete' />
                      <Text size={14} tint={100}>
                        Delete
                      </Text>
                    </Button>
                  </div>
                )}
                {tableBulkActionsVisibility.unarchive && (
                  <div className='selectedRowActionsContainer__selectedItemsArchive'>
                    <Button
                      color='secondary'
                      type='text'
                      onClick={onToggleArchivePopup}
                      className={`Table__header__item ${
                        isOpenArchiveSelectedPopup ? 'opened' : ''
                      }`}
                    >
                      <Icon name='archive' />
                      <Text size={14} tint={100}>
                        Archive
                      </Text>
                    </Button>
                  </div>
                )}
                {tableBulkActionsVisibility.archive && (
                  <div className='selectedRowActionsContainer__selectedItemsArchive'>
                    <Button
                      color='secondary'
                      type='text'
                      onClick={onToggleUnarchivePopup}
                      className={`Table__header__item ${
                        isOpenUnarchiveSelectedPopup ? 'opened' : ''
                      }`}
                    >
                      <Icon name='unarchive' fontSize={18} />
                      <Text size={14} tint={100}>
                        Unarchive
                      </Text>
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              ''
            )}
            <div
              style={{
                height,
                overflow: 'auto',
                minHeight: minHeight || 'unset',
              }}
              ref={tableContainerRef}
            >
              <AutoResizer>
                {({ width, height }) =>
                  custom ? (
                    <div style={{ width, height }}>
                      <ErrorBoundary>
                        <CustomTable
                          expanded={expanded}
                          alwaysVisibleColumns={alwaysVisibleColumns}
                          rowHeightMode={rowHeight}
                          updateColumns={onManageColumns}
                          columnsWidths={columnsWidths}
                          updateColumnsWidths={updateColumnsWidths}
                          sortFields={sortFields}
                          setSortFields={onSort}
                          excludedFields={hiddenColumns}
                          setExcludedFields={onColumnsVisibilityChange}
                          hiddenRows={hiddenRows}
                          data={rowData}
                          columns={columnsData.filter((col) => !col.isHidden)}
                          onGroupExpandToggle={onGroupExpandToggle}
                          onRowHover={rowHoverHandler}
                          onRowClick={rowClickHandler}
                          listWindow={listWindow}
                          multiSelect={multiSelect}
                          selectedRows={selectedRows || {}}
                          onRowSelect={onRowSelect}
                          columnsColorScales={columnsColorScales}
                          onToggleColumnsColorScales={
                            onToggleColumnsColorScales
                          }
                          {...props}
                        />
                      </ErrorBoundary>
                    </div>
                  ) : (
                    <ErrorBoundary>
                      <BaseTable
                        ref={tableRef}
                        classPrefix='BaseTable'
                        columns={columnsData}
                        data={rowData}
                        frozenData={[]}
                        width={width}
                        height={height}
                        fixed={fixed}
                        rowKey='key'
                        isScrolling
                        headerHeight={headerHeight}
                        rowHeight={rowHeight}
                        estimatedRowHeight={estimatedRowHeight}
                        footerHeight={0}
                        defaultExpandedRowKeys={[]}
                        expandColumnKey='#'
                        rowProps={({ rowIndex }) => rowData[rowIndex]?.rowProps}
                        sortBy={{}}
                        useIsScrolling={false}
                        overscanRowCount={1}
                        onEndReachedThreshold={500}
                        getScrollbarSize={() => null}
                        ignoreFunctionInColumnCompare={false}
                        onScroll={() => null}
                        onRowsRendered={() => null}
                        onScrollbarPresenceChange={() => null}
                        onRowExpand={() => null}
                        onExpandedRowsChange={() => null}
                        onColumnSort={() => null}
                        onColumnResize={() => null}
                        onColumnResizeEnd={() => null}
                        onRowHover={onRowHover}
                        onRowClick={onRowClick}
                        disableRowClick={disableRowClick}
                      />
                    </ErrorBoundary>
                  )
                }
              </AutoResizer>
            </div>
            <ArchiveModal
              opened={isOpenArchiveSelectedPopup}
              onClose={onToggleArchivePopup}
              selectedRows={selectedRows}
              archiveMode
              onRowSelect={onRowSelect}
              archiveRuns={archiveRuns}
            />
            <ArchiveModal
              opened={isOpenUnarchiveSelectedPopup}
              onClose={onToggleUnarchivePopup}
              selectedRows={selectedRows}
              onRowSelect={onRowSelect}
              archiveRuns={archiveRuns}
            />
            <DeleteModal
              opened={isOpenDeleteSelectedPopup}
              onClose={onToggleDeletePopup}
              selectedRows={selectedRows}
              onRowSelect={onRowSelect}
              deleteRuns={deleteRuns}
            />
          </div>
        ) : (
          <IllustrationBlock
            page={illustrationConfig?.page || 'metrics'}
            type={illustrationConfig?.type || IllustrationsEnum.EmptyData}
            size={illustrationConfig?.size || 'xLarge'}
            content={illustrationConfig?.content || ''}
            title={illustrationConfig?.title || ''}
          />
        )}
      </BusyLoaderWrapper>
    </ErrorBoundary>
  );
});

function propsComparator(
  prevProps: ITableProps,
  nextProps: ITableProps,
): boolean {
  // Add custom here checks here

  if (prevProps.isLoading !== nextProps.isLoading) {
    return false;
  }

  if (prevProps.rowHeight !== nextProps.rowHeight) {
    return false;
  }

  if (prevProps.sortFields !== nextProps.sortFields) {
    return false;
  }

  if (prevProps.resizeMode !== nextProps.resizeMode) {
    return false;
  }

  if (prevProps.columnsWidths !== nextProps.columnsWidths) {
    return false;
  }

  if (prevProps.selectedRows !== nextProps.selectedRows) {
    return false;
  }

  if (prevProps.hiddenColumns !== nextProps.hiddenColumns) {
    return false;
  }

  if (prevProps.hiddenChartRows !== nextProps.hiddenChartRows) {
    return false;
  }

  if (prevProps.columnsOrder !== nextProps.columnsOrder) {
    return false;
  }

  if (prevProps.focusedState?.active !== nextProps.focusedState?.active) {
    return false;
  }

  if (prevProps.columnsColorScales !== nextProps.columnsColorScales) {
    return false;
  }

  return true;
}

export default React.memo(Table, propsComparator);
