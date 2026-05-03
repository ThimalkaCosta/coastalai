import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileSpreadsheet, CheckCircle, XCircle, X, AlertCircle } from 'lucide-react'

export default function FileUpload({
  title,
  description,
  accept = '.csv',
  acceptTypes = 'csv',
  onUpload,
  file,
  onClear,
  progress = 0,
  error,
  icon: CustomIcon,
}) {
  const [dragActive, setDragActive] = useState(false)

  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onUpload(acceptedFiles[0])
      }
    },
    [onUpload]
  )

  // Configure accepted file types based on acceptTypes prop
  const getAcceptConfig = () => {
    if (acceptTypes === 'nc' || acceptTypes === 'netcdf') {
      return {
        'application/x-netcdf': ['.nc'],
        'application/netcdf': ['.nc'],
        'application/octet-stream': ['.nc'],
      }
    }
    return {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    }
  }

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: getAcceptConfig(),
    maxFiles: 1,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  })

  const Icon = CustomIcon || FileSpreadsheet

  const hasError = error || fileRejections.length > 0
  const errorMessage = error || fileRejections[0]?.errors[0]?.message

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {file ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="card p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-medium text-coastal-900">{file.name}</h4>
                  <p className="text-sm text-coastal-500">
                    {(file.size / 1024).toFixed(1)} KB • {file.name.endsWith('.nc') ? 'NetCDF file' : 'CSV file'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClear}
                className="p-2 text-coastal-400 hover:text-coastal-600 hover:bg-coastal-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {progress > 0 && progress < 100 && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-coastal-500 mb-1">
                  <span>Processing...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-coastal-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-ocean-500 to-primary-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            {...getRootProps()}
            className={`
              card p-8 cursor-pointer transition-all duration-300
              border-2 border-dashed
              ${isDragActive || dragActive
                ? 'border-ocean-500 bg-ocean-50/50'
                : hasError
                ? 'border-red-300 bg-red-50/50'
                : 'border-coastal-200 hover:border-ocean-300 hover:bg-coastal-50'
              }
            `}
          >
            <input {...getInputProps()} />
            
            <div className="flex flex-col items-center text-center">
              <div className={`
                w-16 h-16 rounded-2xl mb-4 flex items-center justify-center transition-colors
                ${isDragActive || dragActive
                  ? 'bg-ocean-100'
                  : hasError
                  ? 'bg-red-100'
                  : 'bg-coastal-100'
                }
              `}>
                {hasError ? (
                  <AlertCircle className="w-8 h-8 text-red-500" />
                ) : isDragActive ? (
                  <Upload className="w-8 h-8 text-ocean-500" />
                ) : (
                  <Icon className="w-8 h-8 text-coastal-400" />
                )}
              </div>

              <h3 className="font-display font-semibold text-coastal-900 mb-1">
                {title}
              </h3>
              <p className="text-sm text-coastal-500 mb-4">
                {description}
              </p>

              {hasError ? (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <XCircle className="w-4 h-4" />
                  {errorMessage}
                </div>
              ) : (
                <div className="text-sm text-coastal-400">
                  <span className="text-ocean-600 font-medium">Click to upload</span> or drag and drop
                  <br />
                  {acceptTypes === 'nc' || acceptTypes === 'netcdf' ? 'NetCDF (.nc) files only' : 'CSV files only'}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
