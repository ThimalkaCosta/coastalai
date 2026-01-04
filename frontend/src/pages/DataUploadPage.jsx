import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Upload,
  FileSpreadsheet,
  Waves,
  Wind,
  Droplets,
  MapPin,
  ArrowRight,
  CheckCircle,
  Info,
  Play,
  Loader2,
  FolderOpen,
} from 'lucide-react'
import PageTransition from '../components/common/PageTransition'
import FileUpload from '../components/upload/FileUpload'
import { useData } from '../context/DataContext'

const uploadSections = [
  {
    id: 'qgisReport',
    title: 'QGIS Analysis Report',
    description: 'Upload all_stat.csv from DSAS analysis',
    icon: MapPin,
    acceptedFile: 'all_stat.csv',
    acceptTypes: 'csv',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'currentData',
    title: 'Current Data',
    description: 'Ocean current velocity measurements',
    icon: Droplets,
    acceptedFile: '2000-2025_Current_Data.nc',
    acceptTypes: 'nc',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'waveData',
    title: 'Wave Data',
    description: 'Wave height and period reanalysis',
    icon: Waves,
    acceptedFile: '2000-2025_Gobal_Ocean_waves.nc',
    acceptTypes: 'nc',
    color: 'from-violet-500 to-purple-500',
  },
  {
    id: 'windData',
    title: 'Wind Data',
    description: 'Wind speed and stress measurements',
    icon: Wind,
    acceptedFile: '2000-2025_Global_Ocean_Wind.nc',
    acceptTypes: 'nc',
    color: 'from-orange-500 to-amber-500',
  },
]

export default function DataUploadPage() {
  const { files, uploadFile, clearFile, uploadProgress, loadDemoData, data } = useData()
  const [showSuccess, setShowSuccess] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [executeStatus, setExecuteStatus] = useState(null)

  const handleUpload = async (sectionId, file) => {
    try {
      await uploadFile(sectionId, file)
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  const handleLoadDemo = () => {
    loadDemoData()
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  // Execute Analysis - Save files and trigger notebook
  const handleExecuteAnalysis = async () => {
    setIsExecuting(true)
    setExecuteStatus('Preparing files...')

    try {
      // Create a mapping of files to save
      const filesToSave = {
        qgisReport: { file: files.qgisReport, name: 'all_stat.csv' },
        currentData: { file: files.currentData, name: files.currentData?.name || '2000-2025_Current_Data(Physics_Reanalysis).nc' },
        waveData: { file: files.waveData, name: files.waveData?.name || '2000-2025_Gobal_Ocain_waves_reanalysis.nc' },
        windData: { file: files.windData, name: files.windData?.name || '2000-2025_Global Ocean Monthly Mean Sea Surface Wind and Stress from Scatterometer and Model.nc' },
      }

      setExecuteStatus('Saving files to workspace...')

      // Use File System Access API if available
      if ('showDirectoryPicker' in window) {
        try {
          const dirHandle = await window.showDirectoryPicker({
            id: 'coastal-research',
            mode: 'readwrite',
            startIn: 'documents',
          })

          // Save each uploaded file
          for (const [key, { file, name }] of Object.entries(filesToSave)) {
            if (file) {
              setExecuteStatus(`Saving ${name}...`)
              const fileHandle = await dirHandle.getFileHandle(name, { create: true })
              const writable = await fileHandle.createWritable()
              await writable.write(file)
              await writable.close()
            }
          }

          setExecuteStatus('Files saved! Opening notebook...')
          
          // Try to open VS Code with the notebook
          // This uses the vscode:// protocol handler
          setTimeout(() => {
            window.open('vscode://file/d:/Kanjana/Coastal_Research/notebook.ipynb', '_blank')
          }, 1000)

          setExecuteStatus('Analysis ready! Run all cells in the notebook.')
          
        } catch (err) {
          if (err.name === 'AbortError') {
            setExecuteStatus('Folder selection cancelled')
          } else {
            throw err
          }
        }
      } else {
        // Fallback: Download files as a zip or individually
        setExecuteStatus('Downloading files...')
        
        for (const [key, { file, name }] of Object.entries(filesToSave)) {
          if (file) {
            const url = URL.createObjectURL(file)
            const a = document.createElement('a')
            a.href = url
            a.download = name
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            await new Promise(r => setTimeout(r, 500)) // Delay between downloads
          }
        }
        
        setExecuteStatus('Files downloaded! Move them to D:\\Kanjana\\Coastal_Research and run notebook.ipynb')
      }

    } catch (error) {
      console.error('Execute analysis failed:', error)
      setExecuteStatus(`Error: ${error.message}`)
    } finally {
      setIsExecuting(false)
      setTimeout(() => setExecuteStatus(null), 5000)
    }
  }

  const allFilesUploaded = Object.values(files).filter(Boolean).length === 4
  const hasData = data.shoreline || data.thresholds

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-coastal-50 to-white">
        {/* Header */}
        <section className="pt-12 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-ocean-100 text-ocean-700 rounded-full text-sm font-medium mb-4">
                <Upload className="w-4 h-4" />
                Data Upload
              </div>
              <h1 className="section-title mb-4">
                Upload Your Research Data
              </h1>
              <p className="section-subtitle">
                Upload your QGIS analysis reports (CSV) and environmental datasets (NetCDF). 
                The system will process your data for threshold detection analysis.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Demo Data Banner */}
        <section className="pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card p-6 bg-gradient-to-r from-ocean-50 to-primary-50 border-ocean-200"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-ocean-100 flex items-center justify-center flex-shrink-0">
                    <Info className="w-5 h-5 text-ocean-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-coastal-900 mb-1">
                      Try with Demo Data
                    </h3>
                    <p className="text-sm text-coastal-600">
                      Don't have data ready? Load demo data to explore the analysis features.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLoadDemo}
                  className="btn-secondary whitespace-nowrap"
                >
                  {hasData ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      Demo Loaded
                    </>
                  ) : (
                    'Load Demo Data'
                  )}
                </button>
              </div>

              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-emerald-100 text-emerald-700 rounded-lg text-sm flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Demo data loaded successfully! You can now view the analysis.
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Upload Sections */}
        <section className="pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-6">
              {uploadSections.map((section, index) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center shadow-lg`}>
                      <section.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-coastal-900">
                        {section.title}
                      </h3>
                      <p className="text-sm text-coastal-500">{section.acceptedFile}</p>
                    </div>
                  </div>
                  
                  <FileUpload
                    title={section.title}
                    description={section.description}
                    icon={section.icon}
                    file={files[section.id]}
                    acceptTypes={section.acceptTypes}
                    onUpload={(file) => handleUpload(section.id, file)}
                    onClear={() => clearFile(section.id)}
                    progress={uploadProgress[section.id] || 0}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Action Section */}
        <section className="pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card p-8 text-center"
            >
              <div className="max-w-md mx-auto">
                {allFilesUploaded ? (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-ocean-500 to-primary-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-display font-semibold text-coastal-900 mb-2">
                      All Files Uploaded!
                    </h3>
                    <p className="text-coastal-600 mb-6">
                      Click "Execute Analysis" to save files to your workspace and run the analysis notebook.
                    </p>
                    
                    <button
                      onClick={handleExecuteAnalysis}
                      disabled={isExecuting}
                      className="btn-primary w-full mb-4 justify-center"
                    >
                      {isExecuting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Executing...
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5" />
                          Execute Analysis
                        </>
                      )}
                    </button>

                    {executeStatus && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3 rounded-lg text-sm flex items-center gap-2 mb-4 ${
                          executeStatus.includes('Error') 
                            ? 'bg-red-100 text-red-700' 
                            : executeStatus.includes('ready') || executeStatus.includes('saved')
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-ocean-100 text-ocean-700'
                        }`}
                      >
                        {executeStatus.includes('Error') ? null : 
                         executeStatus.includes('ready') ? <CheckCircle className="w-4 h-4" /> :
                         <Loader2 className="w-4 h-4 animate-spin" />}
                        {executeStatus}
                      </motion.div>
                    )}

                    <div className="border-t border-coastal-200 pt-4 mt-4">
                      <p className="text-sm text-coastal-500 mb-3">Or view existing analysis:</p>
                      <Link to="/analysis" className="btn-secondary">
                        View Analysis
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </>
                ) : hasData ? (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-display font-semibold text-coastal-900 mb-2">
                      Demo Data Ready
                    </h3>
                    <p className="text-coastal-600 mb-6">
                      Demo data has been loaded. Proceed to view the analysis results and visualizations.
                    </p>
                    <Link to="/analysis" className="btn-primary">
                      View Analysis
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-coastal-100 flex items-center justify-center mx-auto mb-6">
                      <FileSpreadsheet className="w-8 h-8 text-coastal-400" />
                    </div>
                    <h3 className="text-xl font-display font-semibold text-coastal-900 mb-2">
                      Upload Your Data
                    </h3>
                    <p className="text-coastal-600 mb-6">
                      Upload all required datasets or load demo data to explore the analysis features.
                    </p>
                    <div className="flex items-center justify-center gap-4 text-sm text-coastal-500">
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        {Object.values(files).filter(Boolean).length} uploaded
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-coastal-300" />
                        {4 - Object.values(files).filter(Boolean).length} remaining
                      </span>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </PageTransition>
  )
}
