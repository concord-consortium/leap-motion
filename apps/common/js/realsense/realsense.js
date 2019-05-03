// Wrapper around original realsense.js which exports intel.realsense namespace.
// realsense.js doesn't work well with modern JS env. It exports global 'intel' variable, but also depends
// on 'window.intel'. Make sure that it's the same object, as otherwise initialization fails.
// Also, disable annoying logging and provide AutobahnJS dependency.
import './setup-intel-namespace';
import intel from 'imports-loader?intel=>window.intel,console=>{log:function(){}},autobahn=../lib/autobahn-0.10.1!exports-loader?intel!../lib/realsense';

export default intel.realsense;
