import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { transform } from '@babel/standalone';
import { message, Spin, Alert } from 'antd';

// import diskStorage from 'utils/DiskStorage';
import { saveIndexedDB } from 'utils/indexedDbStorage';
import { startRecording, stopRecording } from 'utils/recordRTCHelper';
import createWrappedConsole from 'utils/consoleFactory';
import { subscribeOnCreateRecord } from 'utils/record';
import { getRoomInfo, updateRoomInfo } from 'models/room/actions';
import { setCurrentRecord } from 'models/record/actions';

import ControlWidget from 'components/Widgets/ExamControlWidget';
import ReactPage from 'components/CodingView/React';
import JavaScriptPage from 'components/CodingView/JavaScript';
import RecordVideo from 'components/RecordVideo';

import { updateRecordData, updateRecordVideoUrl } from './actions';

const GetPageComponent = args => {
  switch (args.categoryIndex) {
    case 1: {
      return <ReactPage {...args} />;
    }
    default: {
      return <JavaScriptPage {...args} />;
    }
  }
};

class ExamPage extends Component {
  state = {
    categoryIndex: 0,
    code: '',
    compiledCode: '',
    tape: [],
    console: [],
    visibleIntervieweeModal: true,
    isLoading: false,
    enableEnter: true,
    isRecording: false,
  };

  roomId = this.props.match.params.roomId;

  componentDidMount() {
    this.wrappedConsole = createWrappedConsole(console, this.addConsole);
    this.getRoom();
    this.subscribeCreateRecord();
  }

  getRoom = async () => {
    this.setState({
      isLoading: true,
    });
    await this.props.actions.getRoomInfo(this.roomId);
    await this.passwordSetting();
    this.setState({ isLoading: false });
  };

  passwordSetting = async () => {
    const { roomId } = this;
    const { record, room } = this.props;
    if (!room.password) {
      const password = Math.random()
        .toString(15)
        .substr(2);
      localStorage.examRoomPassword = password;
      await this.props.actions.updateRoomInfo(roomId, password);
    } else if (localStorage.examRoomPassword === room.password) {
      if (record.ques) {
        this.setState({
          categoryIndex: record.ques.type === 'javascript' ? 0 : 1,
          code: record.syncCode || '',
          test: record.ques.test || '',
        });
        this.handleCodeChange(record.syncCode);
      }
    } else {
      message.error("You Can't Not Enter the Page");
      this.setState({
        enableEnter: false,
      });
    }
  };

  handleCodeChange = async newCode => {
    if (newCode === this.state.code) return;
    const { ques, id } = this.props.record;
    const fullCode = `${newCode} ${ques.test}`;
    try {
      const { code: compiledCode } = transform(fullCode, {
        presets: [
          'es2015',
          ['stage-2', { decoratorsBeforeExport: true }],
          'react',
        ],
        plugins: ['proposal-object-rest-spread'],
      });
      this.setState({ compiledCode, code: newCode });
      await this.props.actions.updateRecordData({ id, newCode });
    } catch (e) {
      this.setState({ code: newCode });
      this.resetConsole();
      this.wrappedConsole.log(e);
      await this.props.actions.updateRecordData({ id, newCode });
    }
  };

  onReset = () => {
    const { content } = this.props.record.ques;
    this.setState({ code: content });
    this.handleCodeChange(content);
  };

  addTape = newTape => {
    const { tape } = this.state;
    this.setState({ tape: [...tape, newTape] });
  };

  resetTape = () => {
    this.setState({ tape: [] });
  };

  addConsole = (...args) => {
    const { console: _console } = this.state;
    this.setState({ console: [..._console, ...args] });
  };

  resetConsole = () => {
    this.setState({ console: [] });
  };

  subscribeCreateRecord = () => {
    subscribeOnCreateRecord(data => {
      const { room, ques } = data;
      if (room.id === this.props.room.id) {
        this.props.actions.setCurrentRecord(data);
        // to receive new question dispatched
        this.setState({
          categoryIndex: data.ques.type === 'javascript' ? 0 : 1,
          code: ques.content,
          test: ques.test,
        });
        this.handleCodeChange(ques.content);
      }
    });
  };

  handleStartRecording = () => {
    this.setState({ isRecording: true });
    startRecording();
  };

  handleStopRecording = () => {
    this.setState({ isRecording: false });
    stopRecording(blob => {
      const { id } = this.props.record;

      const mimeType = 'video/webm';
      const fileExtension = 'webm';
      const file = new File([blob], `${id}.${fileExtension}`, {
        type: mimeType,
      });
      saveIndexedDB(file.name, file, null, () => {
        this.props.actions.updateRecordVideoUrl({ id, videoUrl: file.name });
      });

      // diskStorage.StoreFile(file, () => {
      //   this.props.actions.updateRecordVideoUrl({ id, videoUrl: file.name });
      // });
    });
  };

  render() {
    const {
      handleCodeChange,
      wrappedConsole,
      onReset,
      addTape,
      resetTape,
      resetConsole,
    } = this;
    const { isLoading, enableEnter, isRecording } = this.state;
    const { room, record } = this.props;
    return (
      <div>
        {/* eslint-disable camelcase, indent */
        typeof RecordRTC_Extension === 'undefined' && (
          <Alert
            message={
              <p>
                Chrome extension is required:&nbsp;
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://chrome.google.com/webstore/detail/recordrtc/ndcljioonkecdnaaihodjgiliohngojp"
                >
                  RecordRTC_Extension
                </a>
              </p>
            }
            type="warning"
            closeText="Close"
          />
        )
        /* eslint-enable */
        }
        <Spin spinning={isLoading}>
          {enableEnter ? (
            <>
              <ControlWidget
                roomDescription={room.description}
                intervieweeName={room.subjectId}
                onReset={onReset}
                onStartRecording={this.handleStartRecording}
                onStopRecording={this.handleStopRecording}
                isRecording={isRecording}
                isProgressing={!!record.id}
              />
              <GetPageComponent
                handleCodeChange={handleCodeChange}
                wrappedConsole={wrappedConsole}
                onReset={onReset}
                addTape={addTape}
                resetTape={resetTape}
                resetConsole={resetConsole}
                {...this.state}
                {...this.props}
              />
              <RecordVideo fileName={record.videoUrl} />
            </>
          ) : (
            <div>
              <h1>WRONG EXAM ROOM</h1>
            </div>
          )}
        </Spin>
      </div>
    );
  }
}

ExamPage.propTypes = {
  room: PropTypes.object,
  record: PropTypes.object,
};

const mapDispatchToProps = dispatch => ({
  actions: {
    getRoomInfo: id => dispatch(getRoomInfo(id)),
    updateRoomInfo: (id, password) => dispatch(updateRoomInfo(id, password)),
    updateRecordData: recordData => dispatch(updateRecordData(recordData)),
    setCurrentRecord: recordData => dispatch(setCurrentRecord(recordData)),
    updateRecordVideoUrl: data => dispatch(updateRecordVideoUrl(data)),
  },
});

const mapStateToProps = state => ({
  room: state.room,
  record: state.record,
});

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default compose(withConnect)(ExamPage);
